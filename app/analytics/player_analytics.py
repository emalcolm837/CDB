def get_player_totals(conn, player_id):
    """
    Returns total stats for a player across all games.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*) AS games_played,
            SUM(minutes) AS total_minutes,
            SUM(points) AS total_points,
            SUM(rebounds) AS total_rebounds,
            SUM(assists) AS total_assists,
            SUM(steals) AS total_steals,
            SUM(blocks) AS total_blocks,
            SUM(fouls) AS total_fouls,
            SUM(turnovers) AS total_turnovers,
            SUM(FG) AS total_FG,
            SUM(FGA) AS total_FGA,
            SUM(FG3) AS total_FG3,
            SUM(FGA3) AS total_FGA3,
            SUM(FT) AS total_FT,
            SUM(FTA) AS total_FTA,
            SUM(PM) AS total_PM
        FROM stat_line
        WHERE player_id = %s
        """,
        (player_id,)
    )

    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    cols = [c[0] for c in cursor.description]
    return {cols[i]: row[i] for i in range(len(cols))}

def get_player_averages(conn, player_id):
    """
    Returns per-game averages for a player.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            AVG(minutes) AS avg_minutes,
            AVG(points) AS avg_points,
            AVG(rebounds) AS avg_rebounds,
            AVG(assists) AS avg_assists,
            AVG(steals) AS avg_steals,
            AVG(blocks) AS avg_blocks,
            AVG(turnovers) AS avg_turnovers,
            AVG(fouls) AS avg_fouls,
            AVG(FG) AS avg_FG,
            AVG(FGA) AS avg_FGA,
            AVG(FG3) AS avg_FG3,
            AVG(FGA3) AS avg_FGA3,
            AVG(FT) AS avg_FT,
            AVG(FTA) AS avg_FTA,
            AVG(PM) AS avg_PM
        FROM stat_line
        WHERE player_id = %s
        """,
        (player_id,)
    )

    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    cols = [c[0] for c in cursor.description]
    return {cols[i]: row[i] for i in range(len(cols))}
