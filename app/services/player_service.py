# Handles logic for creating and fetching players. 


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

def create_player(conn, name, jersey_number=None, position=None):
    """
    Inserts a new player into the database.
    Returns the new player's ID.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO players (name, jersey_number, position)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (name, jersey_number, position)
    )

    conn.commit()
    row = cursor.fetchone()
    return _row_id(row)

def get_all_players(conn):
    """
    Returns all players as a list of rows.
    """
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM players")
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]

def get_player_by_id(conn, player_id):
    """
    Returns a single player by ID, or None if not found.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM players WHERE id = %s",
        (player_id,)
    )

    row = cursor.fetchone()
    cols = [c[0] for c in cursor.description]
    return _row_to_dict(row, cols)

def delete_player(conn, player_id):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM players WHERE id = %s", (player_id,))
    conn.commit()
    return cursor.rowcount > 0
