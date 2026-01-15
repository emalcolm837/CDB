def migrate_games_add_unique(conn):
    """
    Adds UNIQUE(date, opponent, location) to games by rebuilding the table.
    Also dedupes existing games and remaps stat_lines.game_id accordingly.
    """
    cursor = conn.cursor()

    cursor.execute("BEGIN;")

    cursor.execute(
        """
        CREATE TABLE games_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            opponent TEXT NOT NULL,
            location TEXT,
            UNIQUE(date, opponent, location)
        );
        """
    )

    cursor.execute(
        """
        INSERT INTO games_new (id, date, opponent, location)
        SELECT MIN(id) AS id, date, opponent, location
        FROM games
        GROUP BY date, opponent, location;
        """
    )

    cursor.execute(
        """
        UPDATE stat_line
        SET game_id = (
            SELECT MIN(g2.id)
            FROM games g2
            WHERE g2.date = (SELECT g.date FROM games g WHERE g.id = stat_line.game_id)
                AND g2.opponent = (SELECT g.opponent FROM games g WHERE g.id = stat_line.game_id)
                AND ( (g2.location IS NULL AND (SELECT g.location FROM games g WHERE g.id = stat_line.game_id) IS NULL)
                        OR g2.location = (SELECT g.location FROM GAMES g WHERE g.id = stat_line.game_id) )
        );
        """
    )

    cursor.execute("DROP TABLE games;")
    cursor.execute("ALTER TABLE games_new RENAME TO games;")
    conn.commit()

def migrate_stat_line_add_shooting_columns(conn):
    """
    Adds shooting/plus-minus columns to stat_line if missing.
    """
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(stat_line);")
    existing = {row[1] for row in cursor.fetchall()}
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
        if column not in existing:
            cursor.execute(f"ALTER TABLE stat_line ADD COLUMN {column} INTEGER DEFAULT 0;")

    conn.commit()
