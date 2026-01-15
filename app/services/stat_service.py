# Handles logic for creating and fetching statlines for 
# individual games. 

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

def create_statline(
    conn,
    player_id,
    game_id,
    minutes=0,
    points=0,
    rebounds=0,
    assists=0,
    steals=0,
    blocks=0,
    turnovers=0,
    fouls=0,
    FG=0,
    FGA=0,
    FG3=0,
    FGA3=0,
    FT=0,
    FTA=0,
    PM=0,
    starter=0,
):
    """
    Inserts a stat line for a player in a specific game.
    Returns the stat line ID.
    """

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO stat_line (
            player_id, game_id, minutes, points, rebounds, assists,
            steals, blocks, turnovers, fouls, FG, FGA, FG3, FGA3, FT, FTA, PM, starter)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (player_id, game_id, minutes, points, rebounds, assists,
            steals, blocks, turnovers, fouls, FG, FGA, FG3, FGA3, FT, FTA, PM, starter)
    )

    conn.commit()
    row = cursor.fetchone()
    return _row_id(row)

def update_statline(
    conn,
    player_id,
    game_id,
    minutes=None,
    points=None,
    rebounds=None,
    assists=None,
    steals=None,
    blocks=None,
    turnovers=None,
    fouls=None,
    FG=None,
    FGA=None,
    FG3=None,
    FGA3=None,
    FT=None,
    FTA=None,
    PM=None,
    starter=None,
):
    """
    Updates an existing statline for a player in a game.
    Only fields provided (not None) are updated.
    Returns True if a row was updated, False otherwise.
    """

    cursor = conn.cursor()

    updates = []
    values = []

    # These conditional blocks enable partial updates by dynamically
    # building the SQL SET clause. By checking whether each field is
    # None, we only update the stats explicitly provided, rather than
    # overwriting all columns on every update.

    if minutes is not None:
        updates.append("minutes = %s")
        values.append(minutes)

    if points is not None:
        updates.append("points = %s")
        values.append(points)

    if rebounds is not None:
        updates.append("rebounds = %s")
        values.append(rebounds)

    if assists is not None:
        updates.append("assists = %s")
        values.append(assists)

    if steals is not None:
        updates.append("steals = %s")
        values.append(steals)

    if blocks is not None:
        updates.append("blocks = %s")
        values.append(blocks)

    if turnovers is not None:
        updates.append("turnovers = %s")
        values.append(turnovers)

    if fouls is not None:
        updates.append("fouls = %s")
        values.append(fouls)

    if FG is not None:
        updates.append("FG = %s")
        values.append(FG)

    if FGA is not None:
        updates.append("FGA = %s")
        values.append(FGA)

    if FG3 is not None:
        updates.append("FG3 = %s")
        values.append(FG3)

    if FGA3 is not None:
        updates.append("FGA3 = %s")
        values.append(FGA3)

    if FT is not None:
        updates.append("FT = %s")
        values.append(FT)

    if FTA is not None:
        updates.append("FTA = %s")
        values.append(FTA)

    if PM is not None:
        updates.append("PM = %s")
        values.append(PM)

    if starter is not None:
        updates.append("starter = %s")
        values.append(starter)

    if not updates:
        return False
    
    values.extend([player_id, game_id])

    query = f"""
        UPDATE stat_line
        SET {', '.join(updates)}
        WHERE player_id = %s
        AND game_id = %s
    """

    cursor.execute(query, values)
    conn.commit()

    return cursor.rowcount > 0


def all_player_statlines(conn, player_id):
    """
    Returns all statlines for a given player.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM stat_line WHERE player_id = %s
        """,
        (player_id,)
    )

    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]

def player_stats_for_game(conn, player_id, game_id):
    """
    Returns player's stats for specific game.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * 
        FROM stat_line 
        WHERE player_id = %s
        AND game_id = %s
        """,
        (player_id, game_id)
    )

    row = cursor.fetchone()
    cols = [c[0] for c in cursor.description]
    return _row_to_dict(row, cols)

def get_stats_for_game(conn, game_id):
    """
    Returns all statlines for a given game.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM stat_line WHERE game_id = %s
        """,
        (game_id,)
    )    

    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]

def get_statlines_for_game(conn, game_id: int):
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM stat_line WHERE game_id = %s ORDER BY player_id",
        (game_id,),
    )
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]

def delete_statline(conn, player_id, game_id):
    cursor = conn.cursor()
    cursor.execute(
        """
        DELETE FROM stat_line
        WHERE player_id = %s AND game_id = %s
        """,
        (player_id, game_id),
    )
    conn.commit()
    return cursor.rowcount > 0

def delete_statlines_for_player(conn, player_id):
    cursor = conn.cursor()
    cursor.execute(
        """
        DELETE FROM stat_line
        WHERE player_id = %s
        """,
        (player_id,),
    )
    conn.commit()
    return cursor.rowcount

def delete_statlines_for_game(conn, game_id):
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM stat_line WHERE game_id = %s",
        (game_id,),
    )
    conn.commit()
    return cursor.rowcount

def upsert_statline(
    conn, 
    player_id: int, 
    game_id: int,
    minutes: int = 0,
    points: int = 0,
    rebounds: int = 0,
    assists: int = 0,
    steals: int = 0,
    blocks: int = 0,
    turnovers: int = 0,
    fouls: int = 0,
    FG: int = 0,
    FGA: int = 0,
    FG3: int = 0,
    FGA3: int = 0,
    FT: int = 0,
    FTA: int = 0,
    PM: int = 0,
    starter: int = 0,
):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO stat_line (
            player_id, game_id, minutes, points, rebounds, assists, steals, blocks, turnovers, fouls,
            FG, FGA, FG3, FGA3, FT, FTA, PM, starter
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT(player_id, game_id) DO UPDATE SET
            minutes=excluded.minutes,
            points=excluded.points,
            rebounds=excluded.rebounds,
            assists=excluded.assists,
            steals=excluded.steals,
            blocks=excluded.blocks,
            turnovers=excluded.turnovers,
            fouls=excluded.fouls,
            FG=excluded.FG,
            FGA=excluded.FGA,
            FG3=excluded.FG3,
            FGA3=excluded.FGA3,
            FT=excluded.FT,
            FTA=excluded.FTA,
            PM=excluded.PM,
            starter=excluded.starter
            """,
            (player_id, game_id, minutes, points, rebounds, assists, steals, blocks, turnovers, fouls,
             FG, FGA, FG3, FGA3, FT, FTA, PM, starter),
    )
    conn.commit()
    return True

def get_game_log_for_player(conn, player_id: int):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            g.id AS game_id,
            g.date AS date,
            g.opponent AS opponent,
            g.location AS location,
            s.minutes AS minutes,
            s.points AS points,
            s.rebounds AS rebounds,
            s.assists AS assists,
            s.steals AS steals,
            s.blocks AS blocks,
            s.turnovers AS turnovers,
            s.fouls AS fouls,
            s.FG AS FG,
            s.FGA AS FGA,
            s.FG3 AS FG3,
            s.FGA3 AS FGA3,
            s.FT AS FT,
            s.FTA AS FTA,
            s.PM AS PM
        FROM stat_line s
        JOIN games g ON g.id = s.game_id
        WHERE s.player_id = %s
        ORDER BY g.date
        """,
        (player_id,),
    )
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [_row_to_dict(r, cols) for r in rows]
    
