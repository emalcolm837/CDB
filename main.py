from app.db.connect import get_connection
from app.db.schema import init_db
from app.services.player_service import create_player, get_all_players
from app.services.game_service import create_game, get_all_games
from app.services.stat_service import create_statline, all_player_statlines
from app.analytics.player_analytics import get_player_totals, get_player_averages

def main():
    conn = get_connection()
    init_db(conn)

    player_id = create_player(
        conn,
        name="Alex Moemeka",
        jersey_number=0,
        position="PG"
    )

    game_id = create_game(
        conn,
        date="2025-11-08",
        opponent="RPI",
        location="Home"
    )

    stat_id = create_statline(
        conn,
        player_id=1,
        game_id=1,
        points=18,
        rebounds=5,
        assists=7,
        turnovers=2
    )

    # print("\nAttempting duplicate statline...")

    # try:
    #     create_statline(
    #         conn,
    #         player_id=2,
    #         game_id=1,
    #         points=20,
    #         rebounds=6,
    #         assists=8,
    #         turnovers=3
    #     )
    # except Exception as e:
    #     print("Duplicate insert failed as expected:")
    #     print(e)

    print(f"Created statline ID: {stat_id}")

    # stats = all_player_statlines(conn, player_id)

    # print("\nStats for player:")
    # for stat in stats:
    #     print(dict(stat))

    totals = get_player_totals(conn, player_id)
    averages = get_player_averages(conn, player_id)

    print("Totals:", dict(totals))
    print("Averages:", dict(averages))



if __name__ == "__main__":
    main()
