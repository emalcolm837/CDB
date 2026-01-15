import psycopg

# Handles logic for creating and fetching games.


def _row_id(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row.get("id")
    return row[0]


def _row_to_dict(row, columns):
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    return {columns[i]: row[i] for i in range(len(columns))}

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
        return _row_id(row)
    except psycopg.errors.UniqueViolation:
        return None


def get_all_games(conn):
    """
    Returns all games as a list of rows.
    """
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM games")
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]

def get_game_by_id(conn, game_id):
    """
    Returns a single game by ID, or None if not found.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM games WHERE id = %s",
        (game_id,)
    )

    row = cursor.fetchone()
    cols = [c[0] for c in cursor.description]
    return _row_to_dict(row, cols)

def delete_game(conn, game_id):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM games WHERE id = %s", (game_id,))
    conn.commit()
    return cursor.rowcount > 0
