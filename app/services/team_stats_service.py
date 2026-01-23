STAT_COLUMNS = [
    "minutes",
    "points",
    "rebounds",
    "OREB",
    "assists",
    "steals",
    "blocks",
    "turnovers",
    "fouls",
    "FG",
    "FGA",
    "FG3",
    "FGA3",
    "FT",
    "FTA",
    "PM",
]


def _sum_select(prefix: str) -> str:
    parts = []
    for col in STAT_COLUMNS:
        if col == "PM":
            parts.append(f"COALESCE(ROUND(SUM({prefix}.{col}) / 5.0, 2), 0) AS {col}")
        else:
            parts.append(f"COALESCE(SUM({prefix}.{col}), 0) AS {col}")
    return ",\n            ".join(parts)


def _avg_select(prefix: str, game_count_expr: str) -> str:
    parts = []
    for col in STAT_COLUMNS:
        if col == "PM":
            base = f"CASE WHEN {game_count_expr} = 0 THEN 0 ELSE (1.0 * SUM({prefix}.{col}) / 5.0) / {game_count_expr} END"
        else:
            base = f"CASE WHEN {game_count_expr} = 0 THEN 0 ELSE 1.0 * SUM({prefix}.{col}) / {game_count_expr} END"
        precision = 2 if col == "minutes" else 1
        parts.append(f"COALESCE(ROUND({base}, {precision}), 0) AS {col}")
    return ",\n            ".join(parts)


def _empty_stats() -> dict:
    return {col: 0 for col in STAT_COLUMNS}


def _row_to_dict(row, columns):
    if row is None:
        return None
    if isinstance(row, dict):
        data = row
    else:
        data = {columns[i]: row[i] for i in range(len(columns))}
    return _normalize_stat_keys(data)


def _normalize_stat_keys(data):
    if data is None:
        return None
    mapping = {
        "oreb": "OREB",
        "fg": "FG",
        "fga": "FGA",
        "fg3": "FG3",
        "fga3": "FGA3",
        "ft": "FT",
        "fta": "FTA",
        "pm": "PM",
    }
    out = dict(data)
    for src, dest in mapping.items():
        if src in out and dest not in out:
            out[dest] = out.pop(src)
    return out


def get_team_totals(conn) -> dict:
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT
            {_sum_select("s")}
        FROM stat_line s
        """
    )
    row = cursor.fetchone()
    cols = [c[0] for c in cursor.description]
    return _row_to_dict(row, cols) if row is not None else _empty_stats()


def get_team_averages(conn) -> dict:
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT
            {_avg_select("s", "COUNT(DISTINCT s.game_id)")}
        FROM stat_line s
        """
    )
    row = cursor.fetchone()
    cols = [c[0] for c in cursor.description]
    return _row_to_dict(row, cols) if row is not None else _empty_stats()


def _location_splits(conn, agg_select: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT
            g.location AS label,
            {agg_select}
        FROM stat_line s
        JOIN games g ON g.id = s.game_id
        WHERE g.location IN ('Home', 'Away')
        GROUP BY g.location
        """,
    )
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    dict_rows = [_row_to_dict(r, cols) for r in rows]
    by_label = {r["label"]: r for r in dict_rows if r["label"] in ("Home", "Away")}

    out = []
    for label in ("Home", "Away"):
        if label in by_label:
            out.append(by_label[label])
        else:
            row = {"label": label, **_empty_stats()}
            out.append(row)
    return out


def _opponent_splits(conn, agg_select: str) -> list[dict]:
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT
            g.opponent AS label,
            {agg_select}
        FROM stat_line s
        JOIN games g ON g.id = s.game_id
        GROUP BY g.opponent
        ORDER BY g.opponent
        """,
    )
    rows = cursor.fetchall()
    cols = [c[0] for c in cursor.description]
    dict_rows = [_row_to_dict(r, cols) for r in rows]
    return [r for r in dict_rows if r["label"] is not None]


def get_team_splits_totals(conn) -> dict:
    return {
        "location": _location_splits(conn, _sum_select("s")),
        "opponents": _opponent_splits(conn, _sum_select("s")),
    }


def get_team_splits_averages(conn) -> dict:
    return {
        "location": _location_splits(conn, _avg_select("s", "COUNT(DISTINCT s.game_id)")),
        "opponents": _opponent_splits(conn, _avg_select("s", "COUNT(DISTINCT s.game_id)")),
    }
