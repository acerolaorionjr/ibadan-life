from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_multiplayer_assets_are_wired_into_the_game():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    game = (ROOT / "game.js").read_text(encoding="utf-8")
    assert 'href="multiplayer.css"' in index
    assert 'src="multiplayer-config.js"' in index
    assert 'src="multiplayer.js"' in index
    assert "window.IbadanMultiplayer.open()" in game


def test_browser_config_has_no_embedded_project_secret():
    config = (ROOT / "multiplayer-config.js").read_text(encoding="utf-8")
    assert 'url: ""' in config
    assert 'publishableKey: ""' in config
    assert "service_role" not in config.lower()
    assert "sb_secret_" not in config


def test_multiplayer_backend_uses_rls_and_safety_controls():
    sql = (ROOT / "supabase" / "ibadan_life_multiplayer.sql").read_text(encoding="utf-8").lower()
    for table in (
        "ibadan_profiles",
        "ibadan_game_saves",
        "ibadan_chat_rooms",
        "ibadan_room_messages",
        "ibadan_dm_conversations",
        "ibadan_dm_members",
        "ibadan_dm_messages",
        "ibadan_blocks",
        "ibadan_player_reports",
    ):
        assert f"alter table public.{table} enable row level security" in sql
    assert "function public.ibadan_start_dm" in sql
    assert "grant execute on function public.ibadan_start_dm(uuid) to authenticated" in sql
    assert "char_length(body) between 1 and 500" in sql
    assert "extension = 'presence'" in sql


def test_multiplayer_has_room_chat_direct_messages_and_moderation():
    source = (ROOT / "multiplayer.js").read_text(encoding="utf-8")
    for marker in (
        "ibadan_room_messages",
        "ibadan_dm_messages",
        "ibadan_start_dm",
        "presence",
        "blockPlayer",
        "reportPlayer",
    ):
        assert marker in source
