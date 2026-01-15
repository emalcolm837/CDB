def player_totals_and_averages(conn):
    """
    Returns per-player totals and per-game averages across all games.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            p.id AS player_id,
            p.name AS name,
            p.jersey_number AS jersey_number,
            p.position AS position,
            COUNT(sl.game_id) AS gp,
        
            COALESCE(SUM(sl.minutes), 0) AS total_minutes,
            COALESCE(SUM(sl.points), 0) AS total_points,
            COALESCE(SUM(sl.rebounds), 0) AS total_rebounds,
            COALESCE(SUM(sl.assists), 0) AS total_assists,
            COALESCE(SUM(sl.steals), 0) AS total_steals,
            COALESCE(SUM(sl.blocks), 0) AS total_blocks,
            COALESCE(SUM(sl.turnovers), 0) AS total_turnovers,
            COALESCE(SUM(sl.fouls), 0) AS total_fouls,
            COALESCE(SUM(sl.FG), 0) AS total_FG,
            COALESCE(SUM(sl.FGA), 0) AS total_FGA,
            COALESCE(SUM(sl.FG3), 0) AS total_FG3,
            COALESCE(SUM(sl.FGA3), 0) AS total_FGA3,
            COALESCE(SUM(sl.FT), 0) AS total_FT,
            COALESCE(SUM(sl.FTA), 0) AS total_FTA,
            COALESCE(SUM(sl.PM), 0) AS total_PM,

            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.minutes) / COUNT(sl.game_id), 2) END AS avg_minutes,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.points) / COUNT(sl.game_id), 2) END AS avg_points,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.rebounds) / COUNT(sl.game_id), 2) END AS avg_rebounds,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.assists) / COUNT(sl.game_id), 2) END AS avg_assists,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.steals) / COUNT(sl.game_id), 2) END AS avg_steals,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.blocks) / COUNT(sl.game_id), 2) END AS avg_blocks,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.turnovers) / COUNT(sl.game_id), 2) END AS avg_turnovers,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.fouls) / COUNT(sl.game_id), 2) END AS avg_fouls,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FG) / COUNT(sl.game_id), 2) END AS avg_FG,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FGA) / COUNT(sl.game_id), 2) END AS avg_FGA,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FG3) / COUNT(sl.game_id), 2) END AS avg_FG3,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FGA3) / COUNT(sl.game_id), 2) END AS avg_FGA3,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FT) / COUNT(sl.game_id), 2) END AS avg_FT,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.FTA) / COUNT(sl.game_id), 2) END AS avg_FTA,
            CASE WHEN COUNT(sl.game_id) = 0 THEN 0 ELSE ROUND(1.0 * SUM(sl.PM) / COUNT(sl.game_id), 2) END AS avg_PM

        FROM players p
        LEFT JOIN stat_line sl ON sl.player_id = p.id
        GROUP by p.id
        ORDER BY total_points DESC, avg_points DESC
        """
    )
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    return [{cols[i]: r[i] if not isinstance(r, dict) else r[cols[i]] for i in range(len(cols))} if not isinstance(r, dict) else r for r in rows]

def leaders(conn, limit: int = 5):
    """
    Returns top-N leaders by totals in key categories.
    """
    cursor = conn.cursor()

    metric_map = {
        "minutes" : "minutes",
        "points" : "points",
        "rebounds" : "rebounds",
        "assists" : "assists",
        "steals" : "steals",
        "blocks" : "blocks",
        "turnovers" : "turnovers",
        "fouls" : "fouls",
        "FG" : "FG",
        "FGA" : "FGA",
        "FG3" : "FG3",
        "FGA3" : "FGA3",
        "FT" : "FT",
        "FTA" : "FTA",
        "PM" : "PM",
    }

    out = {}
    for metric, column in metric_map.items():
        cursor.execute(
            f"""
            SELECT
                p.id AS player_id,
                p.name,
                p.jersey_number,
                COALESCE(SUM(sl.{column}), 0) AS value
            FROM players p
            LEFT JOIN stat_line sl ON sl.player_id = p.id
            GROUP by p.id
            ORDER BY value DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        cols = [c[0] for c in cursor.description]
        out[metric] = [{cols[i]: r[i] if not isinstance(r, dict) else r[cols[i]] for i in range(len(cols))} if not isinstance(r, dict) else r for r in rows]

    return out
