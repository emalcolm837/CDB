# Handles logic for creating and fetching players. 

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
    return row["id"] if row else None

def get_all_players(conn):
    """
    Returns all players as a list of rows.
    """
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM players")
    return cursor.fetchall()

def get_player_by_id(conn, player_id):
    """
    Returns a single player by ID, or None if not found.
    """
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM players WHERE id = %s",
        (player_id,)
    )

    return cursor.fetchone()

def delete_player(conn, player_id):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM players WHERE id = %s", (player_id,))
    conn.commit()
    return cursor.rowcount > 0
