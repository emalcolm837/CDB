def get_player_totals(conn, player_id):
    """
    Returns total stats for a player across all games.
    """
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*) AS games_played,
            COALESCE(SUM(minutes), 0) AS total_minutes,
            COALESCE(SUM(points), 0) AS total_points,
            COALESCE(SUM(rebounds), 0) AS total_rebounds,
            COALESCE(SUM(OREB), 0) AS total_OREB,
            COALESCE(SUM(assists), 0) AS total_assists,
            COALESCE(SUM(steals), 0) AS total_steals,
            COALESCE(SUM(blocks), 0) AS total_blocks,
            COALESCE(SUM(fouls), 0) AS total_fouls,
            COALESCE(SUM(turnovers), 0) AS total_turnovers,
            COALESCE(SUM(FG), 0) AS total_FG,
            COALESCE(SUM(FGA), 0) AS total_FGA,
            COALESCE(SUM(FG3), 0) AS total_FG3,
            COALESCE(SUM(FGA3), 0) AS total_FGA3,
            COALESCE(SUM(FT), 0) AS total_FT,
            COALESCE(SUM(FTA), 0) AS total_FTA,
            COALESCE(SUM(PM), 0) AS total_PM
        FROM stat_line
        WHERE player_id = %s
            AND COALESCE(minutes, 0) > 0
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
            COALESCE(ROUND(AVG(minutes), 2), 0) AS avg_minutes,
            COALESCE(ROUND(AVG(points), 1), 0) AS avg_points,
            COALESCE(ROUND(AVG(rebounds), 1), 0) AS avg_rebounds,
            COALESCE(ROUND(AVG(OREB), 1), 0) AS avg_OREB,
            COALESCE(ROUND(AVG(assists), 1), 0) AS avg_assists,
            COALESCE(ROUND(AVG(steals), 1), 0) AS avg_steals,
            COALESCE(ROUND(AVG(blocks), 1), 0) AS avg_blocks,
            COALESCE(ROUND(AVG(turnovers), 1), 0) AS avg_turnovers,
            COALESCE(ROUND(AVG(fouls), 1), 0) AS avg_fouls,
            COALESCE(ROUND(AVG(FG), 1), 0) AS avg_FG,
            COALESCE(ROUND(AVG(FGA), 1), 0) AS avg_FGA,
            COALESCE(ROUND(AVG(FG3), 1), 0) AS avg_FG3,
            COALESCE(ROUND(AVG(FGA3), 1), 0) AS avg_FGA3,
            COALESCE(ROUND(AVG(FT), 1), 0) AS avg_FT,
            COALESCE(ROUND(AVG(FTA), 1), 0) AS avg_FTA,
            COALESCE(ROUND(AVG(PM), 1), 0) AS avg_PM
        FROM stat_line
        WHERE player_id = %s
            AND COALESCE(minutes, 0) > 0
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
