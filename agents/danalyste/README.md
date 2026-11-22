# Danalyste-127 — l'analyste de données du Cercle

Agent Python construit avec le [Mistral Agents SDK](https://docs.mistral.ai/) : il analyse les données du Cercle 127 — rêves déposés dans le Grimoire, lectures « Perle d'Oni » (3,90 €), symboles et émotions récurrents, canaux (web, app, lettre) — et rédige des rapports en markdown.

## Structure

```
danalyste/
├── main.py          # Agent + outils (pandas)
├── data/            # Jeux de données à analyser (CSV, TSV, JSON, Excel)
│   └── exemple_grimoire.csv
├── reports/         # Rapports générés par l'agent
└── tests/           # Tests hors-ligne (ScriptedModel, sans clé API)
```

## Installation

```bash
cd agents/danalyste
uv sync
cp .env.example .env   # puis y coller une clé MISTRAL_API_KEY
```

## Utilisation

```bash
uv run agents chat                    # conversation interactive
uv run agents chat -m "Quels sont les symboles les plus récurrents ?"
uv run python main.py                 # question de démonstration
uv run agents info                    # vérifier l'agent et ses outils
```

Deposez vos propres fichiers CSV/Excel dans `data/` puis demandez par exemple :

- « Profil du grimoire : combien de rêves, quelles colonnes, valeurs manquantes ? »
- « Conversion rêve → Perle d'Oni par canal, avec volumes. »
- « Top 10 des symboles récurrents et leur taux de lecture achetée. »
- « Rédige un rapport mensuel dans reports/. »

## Outils exposés au modèle

| Outil | Rôle |
| --- | --- |
| `list_datasets` | Lister les fichiers de `data/` |
| `dataset_profile` | Dimensions, types, valeurs manquantes, aperçu |
| `column_summary` | Statistiques ou fréquences d'une colonne |
| `run_pandas` | Calcul sur mesure (groupby, corrélations, séries temporelles) |
| `save_report` | Écrire un rapport markdown dans `reports/` |

## Tests

```bash
uv run pytest
```

Les tests utilisent un `ScriptedModel` (aucun appel réseau, aucune clé API) et vérifient les outils pandas ainsi qu'un tour complet scripté.

## Confidentialité

Les récits de rêves sont confidentiels : l'agent travaille sur des motifs agrégés et ne doit jamais reproduire un récit intégral. La clé API vit dans `.env`, ignoré par git.
