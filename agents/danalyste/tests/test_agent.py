from mistralai import agents

import main

LIST_CODE = "return tools.client.list_datasets();"
PANDAS_CODE = "return tools.client.run_pandas({dataset: 'exemple_grimoire.csv', code: \"(df['perle_oni'] == 1).sum()\"});"


async def test_scripted_turn_runs_pandas_and_replies() -> None:
    model = agents.testing.ScriptedModel(
        [
            agents.testing.run_typescript(PANDAS_CODE),
            agents.testing.reply("26 lectures Perle d'Oni enregistrées."),
        ]
    )

    state = await main.agent.override(model=model).run(
        "Combien de lectures Perle d'Oni ont été enregistrées ?"
    )

    assert isinstance(state, agents.Completed), state
    assert state.output == "26 lectures Perle d'Oni enregistrées."
    assert [appel.name for appel in state.tool_calls] == ["client.run_pandas"]
    model.assert_consumed()


async def test_tools_list_datasets() -> None:
    model = agents.testing.ScriptedModel(
        [
            agents.testing.run_typescript(LIST_CODE),
            agents.testing.reply("Un dataset est disponible : exemple_grimoire.csv."),
        ]
    )

    state = await main.agent.override(model=model).run("Quelles données as-tu ?")

    assert isinstance(state, agents.Completed), state
    assert [appel.name for appel in state.tool_calls] == ["client.list_datasets"]
    model.assert_consumed()


def test_list_datasets_tool_directly() -> None:
    assert main.list_datasets() == ["exemple_grimoire.csv"]


def test_run_pandas_tool_directly() -> None:
    resultat = main.run_pandas(
        "exemple_grimoire.csv",
        "df.groupby('symboles')['perle_oni'].sum().idxmax()",
    )
    assert isinstance(resultat, str)
    assert len(resultat) > 0


def test_unknown_dataset_raises_tool_error() -> None:
    try:
        main.run_pandas("inconnu.csv", "df.shape")
    except agents.ToolError:
        pass
    else:
        raise AssertionError("agents.ToolError attendu pour un dataset inconnu")


def test_unknown_column_raises_tool_error() -> None:
    try:
        main.column_summary("exemple_grimoire.csv", "colonne_absente")
    except agents.ToolError:
        pass
    else:
        raise AssertionError("agents.ToolError attendu pour une colonne absente")


def test_save_report_tool_directly(tmp_path) -> None:
    original = main.REPORTS_DIR
    main.REPORTS_DIR = tmp_path
    try:
        chemin = main.save_report("Test du Cercle", "# Test\n\nChiffres clés.")
    finally:
        main.REPORTS_DIR = original
    assert chemin.endswith("test-du-cercle.md")
    assert (tmp_path / "test-du-cercle.md").read_text(encoding="utf-8").startswith("# Test")
