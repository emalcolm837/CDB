from app.services.player_service import create_player
from app.services.game_service import create_game
from app.services.stat_service import create_statline
from app.analytics.player_analytics import (
    get_player_totals,
    get_player_averages
)

def test_player_totals(db_conn):
    player_id = create_player(db_conn, "Test Player", 10, "G")

    game1_id = create_game(db_conn, "2025-01-01", "Opponent A", "Home")
    game2_id = create_game(db_conn, "2025-01-01", "Opponent B", "Away")

    create_statline(db_conn, player_id, game1_id, points=10, rebounds=4, assists=3)
    create_statline(db_conn, player_id, game2_id, points=20, rebounds=6, assists=7)

    totals = get_player_totals(db_conn, player_id)

    assert totals["games_played"] == 2
    assert totals["total_points"] == 30
    assert totals["total_rebounds"] == 10
    assert totals["total_assists"] == 10

def test_player_averages(db_conn):
    player_id = create_player(db_conn, "Test Player", 10, "G")

    game1_id = create_game(db_conn, "2025-01-01", "Opponent A", "Home")
    game2_id = create_game(db_conn, "2025-01-02", "Opponent B", "Away")

    create_statline(db_conn, player_id, game1_id, points=12, rebounds=6, assists=4)
    create_statline(db_conn, player_id, game2_id, points=18, rebounds=4, assists=6)
    
    averages = get_player_averages(db_conn, player_id)

    assert averages["avg_points"] == 15
    assert averages["avg_rebounds"] == 5
    assert averages["avg_assists"] == 5

def test_player_analytics_no_games(db_conn):
    player_id = create_player(db_conn, "Inactive Player", 99, "F")

    totals = get_player_totals(db_conn, player_id)
    averages = get_player_averages(db_conn, player_id)

    assert totals["games_played"] == 0
    assert totals["total_points"] is None
    assert averages["avg_points"] is None