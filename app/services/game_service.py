import psycopg

# Handles logic for creating and fetching games.

def create_game(conn, date, opponent, location=None):
    """
    Imserts a new game into the database.
    Returns the new game's ID.
    """
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO games (date, opponent, location)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (date, opponent, location)
        )

        conn.commit()
        row = cursor.fetchone()
        return row["id"] if row else None
    except psycopg.errors.UniqueViolation:
        return None


def get_all_games(conn):
    """
    Returns all games as a list of rows.
    """
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM games")
    return cursor.fetchall()

def get_game_by_id(conn, game_id):
    """
    Returns a single game by ID, or None if not found.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM games WHERE id = %s",
        (game_id,)
    )

    return cursor.fetchone()

def delete_game(conn, game_id):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM games WHERE id = %s", (game_id,))
    conn.commit()
    return cursor.rowcount > 0
