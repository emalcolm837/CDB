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
            SUM(OREB) AS total_OREB,
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
        return _normalize_player_analytics_keys(row)
    cols = [c[0] for c in cursor.description]
    return _normalize_player_analytics_keys({cols[i]: row[i] for i in range(len(cols))})

def get_player_averages(conn, player_id):
    """
    Returns per-game averages for a player.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            ROUND(AVG(minutes), 2) AS avg_minutes,
            ROUND(AVG(points), 1) AS avg_points,
            ROUND(AVG(rebounds), 1) AS avg_rebounds,
            ROUND(AVG(OREB), 1) AS avg_OREB,
            ROUND(AVG(assists), 1) AS avg_assists,
            ROUND(AVG(steals), 1) AS avg_steals,
            ROUND(AVG(blocks), 1) AS avg_blocks,
            ROUND(AVG(turnovers), 1) AS avg_turnovers,
            ROUND(AVG(fouls), 1) AS avg_fouls,
            ROUND(AVG(FG), 1) AS avg_FG,
            ROUND(AVG(FGA), 1) AS avg_FGA,
            ROUND(AVG(FG3), 1) AS avg_FG3,
            ROUND(AVG(FGA3), 1) AS avg_FGA3,
            ROUND(AVG(FT), 1) AS avg_FT,
            ROUND(AVG(FTA), 1) AS avg_FTA,
            ROUND(AVG(PM), 1) AS avg_PM
        FROM stat_line
        WHERE player_id = %s
        """,
        (player_id,)
    )

    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return _normalize_player_analytics_keys(row)
    cols = [c[0] for c in cursor.description]
    return _normalize_player_analytics_keys({cols[i]: row[i] for i in range(len(cols))})


def _normalize_player_analytics_keys(data):
    mapping = {
        "total_oreb": "total_OREB",
        "avg_oreb": "avg_OREB",
    }
    out = dict(data)
    for src, dest in mapping.items():
        if src in out and dest not in out:
            out[dest] = out.pop(src)
    return out
