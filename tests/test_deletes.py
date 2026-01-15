from app.services.player_service import create_player, delete_player
from app.services.game_service import create_game, delete_game
from app.services.stat_service import (
    create_statline, 
    delete_statline, delete_statlines_for_game, 
    delete_statlines_for_player)

def test_delete_statline(db_conn):
    pid = create_player(db_conn, "P", 1, "G")
    gid = create_game(db_conn, "2026-01-01", "Opp", "Home")
    create_statline(db_conn, pid, gid, points=10)

    assert delete_statline(db_conn, pid, gid) is True
    assert delete_statline(db_conn, pid, gid) is False

def test_delete_player_cleans_statlines(db_conn):
    pid = create_player(db_conn, "P", 1, "G")
    gid = create_game(db_conn, "2026-01-01", "Opp", "Home")
    create_statline(db_conn, pid, gid, points=10)

    delete_statlines_for_player(db_conn, pid)
    assert delete_player(db_conn, pid) is True

def test_delete_game_cleans_statlines(db_conn):
    pid = create_player(db_conn, "P", 1, "G")
    gid = create_game(db_conn, "2026-01-01", "Opp", "Home")
    create_statline(db_conn, pid, gid, points=10)

    delete_statlines_for_game(db_conn, gid)
    assert delete_game(db_conn, gid) is True