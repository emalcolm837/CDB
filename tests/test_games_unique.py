from app.services.game_service import create_game

def test_create_game_duplicate_returns_none(db_conn):
    g1 = create_game(db_conn, "2026-01-05", "Central High", "Home")
    assert g1 is not None

    g2 = create_game(db_conn, "2026-01-05", "Central High", "Home")
    assert g2 is None