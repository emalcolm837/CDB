from app.services.player_service import create_player, get_player_by_id

def test_create_player(db_conn):
    player_id = create_player(
        db_conn,
        name = "Test Player",
        jersey_number = 10,
        position="G"
    )

    player = get_player_by_id(db_conn, player_id)

    assert player is not None
    assert player["name"] == "Test Player"
    assert player["jersey_number"] == 10
    assert player["position"] == "G"