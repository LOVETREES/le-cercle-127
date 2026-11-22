import asyncio
import re
from pathlib import Path

import pandas as pd
from mistralai import agents

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"

READABLE_SUFFIXES = {".csv", ".tsv", ".json", ".xlsx", ".xls"}

INSTRUCTIONS = """Tu es Danalyste, l'analyste de données du Cercle 127 (lecercle127.com), le sanctuaire onirique d'Oni et de ses six Sœurs.

Ton rôle : éclairer l'activité du Cercle avec des chiffres nets, jamais du bruit — seulement de la lumière.

Les données vivent dans le dossier `data/` du projet. Les rapports que tu rédiges sont écrits dans `reports/`.

Ta méthode, à chaque question :
1. Regarde d'abord quelles données existent (tool `list_datasets`) et profile le jeu pertinent (`dataset_profile`) avant toute affirmation.
2. Analyse avec `column_summary` (répartitions, statistiques) puis `run_pandas` pour les calculs sur mesure (groupby, corrélations, séries temporelles).
3. Cite toujours les volumes (n) et les périodes. Distingue l'observation chiffrée de l'interprétation symbolique : chiffres d'abord, conseil ensuite.
4. Rédige en français, avec un ton calme et précis digne du Cercle. Structure : constats chiffrés, puis implications, puis un prochain pas concret.
5. Quand l'analyse est complète et qu'elle le mérite, propose ou produis un rapport avec `save_report` (markdown : titre, période analysée, chiffres clés, insights, recommandations).

Contexte métier du Cercle 127 :
- Rêves déposés dans le Grimoire (gratuits) et lectures détaillées « Perle d'Oni » à 3,90 €.
- Sept Sœurs : Oni (lecture), Alka (relie), Naïa (apaise), Terra (enracine), Ignis (agit), Astria (oriente), Irma (choisit).
- Oracle 127 : tirage d'une carte par question ; lettre à la nouvelle lune.
- Métriques qui comptent : rêves déposés par semaine, taux de conversion rêve → Perle d'Oni, symboles récurrents, émotions dominantes, rétention des comptes Grimoire.

Règles : ne fabrique jamais un chiffre absent des données ; si un dataset manque ou une colonne est absente, dis-le et propose ce qui existe. Les récits de rêves sont confidentiels : n'en cite jamais le contenu intégral, seulement des motifs agrégés et anonymes."""


def _dataset_path(dataset: str) -> Path:
    candidates = list(DATA_DIR.glob(dataset))
    matches = [path for path in candidates if path.is_file() and path.suffix.lower() in READABLE_SUFFIXES]
    if not matches:
        known = _list_dataset_names()
        raise agents.ToolError(
            f"Aucun dataset nommé « {dataset} » dans data/. Datasets disponibles : {known}."
        )
    return matches[0]


def _load_dataframe(dataset: str) -> pd.DataFrame:
    path = _dataset_path(dataset)
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if path.suffix.lower() == ".json":
        return pd.read_json(path)
    return pd.read_csv(path, sep="\t" if path.suffix.lower() == ".tsv" else ",")


def _list_dataset_names() -> list[str]:
    return sorted(
        path.name
        for path in DATA_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in READABLE_SUFFIXES
    )


@agents.tool
def list_datasets() -> list[str]:
    """Liste les jeux de données disponibles dans data/ (fichiers CSV, TSV, JSON, Excel)."""
    return _list_dataset_names()


@agents.tool
def dataset_profile(dataset: str) -> dict:
    """Profil complet d'un dataset : dimensions, types, valeurs manquantes et 5 premières lignes."""
    frame = _load_dataframe(dataset)
    return {
        "fichier": _dataset_path(dataset).name,
        "lignes": int(len(frame)),
        "colonnes": list(frame.columns),
        "types": {colonne: str(dtype) for colonne, dtype in frame.dtypes.items()},
        "valeurs_manquantes": {colonne: int(n) for colonne, n in frame.isna().sum().items() if n > 0},
        "aperçu": frame.head(5).to_dict(orient="records"),
    }


@agents.tool
def column_summary(
    dataset: str,
    column: str,
    top: int = 15,
) -> dict:
    """Résumé statistique d'une colonne : describe() pour une colonne numérique, sinon les valeurs les plus fréquentes."""
    frame = _load_dataframe(dataset)
    if column not in frame.columns:
        raise agents.ToolError(
            f"Colonne « {column} » absente. Colonnes disponibles : {list(frame.columns)}."
        )
    serie = frame[column]
    if pd.api.types.is_numeric_dtype(serie):
        description = serie.describe()
        return {"colonne": column, "type": "numérique", "statistiques": {cle: float(valeur) for cle, valeur in description.items()}}
    comptage = serie.value_counts().head(top)
    return {
        "colonne": column,
        "type": "catégorielle",
        "valeurs_uniques": int(serie.nunique(dropna=True)),
        "fréquences": {str(cle): int(valeur) for cle, valeur in comptage.items()},
    }


@agents.tool
def run_pandas(dataset: str, code: str) -> str:
    """Exécute un court programme pandas sur le dataset et renvoie le résultat de la dernière expression. La variable `df` contient les données ; `pd` est pandas. Exemple : df.groupby('canal')['montant_eur'].sum()"""
    frame = _load_dataframe(dataset)
    contexte = {"df": frame, "pd": pd}
    try:
        exec(compile(code, "<analyse>", "exec"), contexte)
    except agents.ToolError:
        raise
    except Exception as erreur:
        raise agents.ToolError(
            f"Le code pandas a échoué ({type(erreur).__name__}: {erreur}). "
            "Vérifie les noms de colonnes via dataset_profile et simplifie le calcul."
        ) from erreur
    if "_" in contexte and contexte["_"] is not None:
        return str(contexte["_"])
    return "Code exécuté sans valeur finale ; assigne le résultat à _ pour le voir."


@agents.tool
def save_report(title: str, markdown: str) -> str:
    """Écrit un rapport d'analyse en markdown dans reports/ et renvoie son chemin."""
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "rapport"
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    chemin = REPORTS_DIR / f"{slug}.md"
    chemin.write_text(markdown, encoding="utf-8")
    try:
        affichage = chemin.relative_to(BASE_DIR)
    except ValueError:
        affichage = chemin
    return f"Rapport écrit : {affichage}"


agent = agents.Agent(
    model="mistral-large-4",
    name="danalyste-127",
    instructions=INSTRUCTIONS,
    tools=[list_datasets, dataset_profile, column_summary, run_pandas, save_report],
)


async def main() -> None:
    question = "Quels sont les symboles les plus récurrents dans les rêves, et quelle est la tendance des lectures Perle d'Oni ?"
    print(f"→ {question}\n")
    resultat = await agent.run(question)
    if isinstance(resultat, agents.Completed):
        print(resultat.text)
        print("\nAppels d'outils :", [appel.name for appel in resultat.tool_calls])
    else:
        print(f"Tour non complété : {resultat}")


if __name__ == "__main__":
    asyncio.run(main())
