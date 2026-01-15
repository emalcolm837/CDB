import pytest
from app.services.player_service import create_player
from app.services.game_service import create_game
from app.services.stat_service import (
    create_statline,
    update_statline,
    player_stats_for_game,
)

def test_create_statline(db_conn):
    player_id = create_player(db_conn, "Player One", 1, "PG")
    game_id = create_game(db_conn, "2025-01-01", "Opponent", "Home")

    stat_id = create_statline(
        db_conn,
        player_id,
        game_id,
        points = 15,
        rebounds = 4,
        assists = 6, 
        turnovers = 2
    )

    stats = player_stats_for_game(db_conn, player_id, game_id)
    
    assert stats is not None
    assert stats["points"] == 15
    assert stats["assists"] == 6

def test_duplicate_statline_fails(db_conn):
    player_id = create_player(db_conn, "Player One", 1, "PG")
    game_id = create_game(db_conn, "2025-01-01", "Opponent", "Home")

    create_statline(db_conn, player_id, game_id, points=10)

    with pytest.raises(Exception):
        create_statline(db_conn, player_id, game_id, points=20)

def test_update_statline(db_conn):
    player_id = create_player(db_conn, "Player One", 1, "PG")
    game_id = create_game(db_conn, "2025-01-01", "Opponent", "Home")

    create_statline(db_conn, player_id, game_id, points=10, assists=3)

    updated = update_statline(db_conn, player_id, game_id, points=18, assists=7)

    assert updated is True

    stats = player_stats_for_game(db_conn, player_id, game_id)
    assert stats["points"] == 18
    assert stats["assists"] == 7