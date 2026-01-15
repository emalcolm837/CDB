def migrate_games_add_unique(conn):
    """
    Adds UNIQUE(date, opponent, location) to games using Postgres-native SQL.
    Also dedupes existing games and remaps stat_lines.game_id accordingly.
    """
    cursor = conn.cursor()

    cursor.execute("BEGIN;")

    cursor.execute(
        """
        WITH keepers AS (
            SELECT MIN(id) AS keep_id, date, opponent, location
            FROM games
            GROUP BY date, opponent, location
        )
        UPDATE stat_line s
        SET game_id = k.keep_id
        FROM games g
        JOIN keepers k
            ON g.date = k.date
            AND g.opponent = k.opponent
            AND (g.location IS NOT DISTINCT FROM k.location)
        WHERE s.game_id = g.id
            AND g.id <> k.keep_id;
        """
    )

    cursor.execute(
        """
        WITH keepers AS (
            SELECT MIN(id) AS keep_id, date, opponent, location
            FROM games
            GROUP BY date, opponent, location
        )
        DELETE FROM games g
        USING keepers k
        WHERE g.date = k.date
            AND g.opponent = k.opponent
            AND (g.location IS NOT DISTINCT FROM k.location)
            AND g.id <> k.keep_id;
        """
    )

    cursor.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS games_unique_idx
        ON games (date, opponent, location);
        """
    )

    conn.commit()

def migrate_stat_line_add_shooting_columns(conn):
    """
    Adds shooting/plus-minus columns to stat_line if missing.
    """
    cursor = conn.cursor()
    columns = [
        "FG",
        "FGA",
        "FG3",
        "FGA3",
        "FT",
        "FTA",
        "PM",
        "starter",
    ]

    for column in columns:
        cursor.execute(f"ALTER TABLE stat_line ADD COLUMN IF NOT EXISTS {column} INTEGER DEFAULT 0;")

    conn.commit()
