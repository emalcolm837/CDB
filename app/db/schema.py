# Initializes database and its layout. 

def init_db(conn):
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            jersey_number INTEGER,
            position TEXT
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS games (
            id SERIAL PRIMARY KEY,
            date TEXT NOT NULL,
            opponent TEXT NOT NULL,
            location TEXT,
            UNIQUE(date, opponent, location)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stat_line (
            id SERIAL PRIMARY KEY,
            player_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            minutes NUMERIC(6,3) DEFAULT 0,
            points INTEGER DEFAULT 0,
            rebounds INTEGER DEFAULT 0,
            assists INTEGER DEFAULT 0,
            steals INTEGER DEFAULT 0,
            blocks INTEGER DEFAULT 0,
            turnovers INTEGER DEFAULT 0,
            fouls INTEGER DEFAULT 0,
            FG INTEGER DEFAULT 0,
            FGA INTEGER DEFAULT 0,
            FG3 INTEGER DEFAULT 0,
            FGA3 INTEGER DEFAULT 0,
            FT INTEGER DEFAULT 0,
            FTA INTEGER DEFAULT 0,
            PM INTEGER DEFAULT 0,
            starter INTEGER DEFAULT 0,
            FOREIGN KEY (player_id) REFERENCES players(id),
            FOREIGN KEY (game_id) REFERENCES games(id),
            UNIQUE(player_id, game_id)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'viewer')),
            created_at TIMESTAMP NOT NULL DEFAULT (now())
        );
    """)

    conn.commit()
