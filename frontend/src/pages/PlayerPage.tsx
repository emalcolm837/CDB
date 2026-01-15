import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, clearToken } from "../api";

type Player = {
    id: number;
    name: string;
    jersey_number: number;
    position: string;
};

type StatLine = {
    game_id: number;
    date: string;
    opponent: string;
    location: string;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    FG: number;
    FGA: number;
    FG3: number;
    FGA3: number;
    FT: number;
    FTA: number;
    PM: number;
};

type StatTotals = {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    FG: number;
    FGA: number;
    FG3: number;
    FGA3: number;
    FT: number;
    FTA: number;
    PM: number;
};

type SplitRow = { label: string } & StatTotals;
type Splits = { location: SplitRow[]; opponents: SplitRow[] };

export default function PlayerPage() {
    const { playerId } = useParams();
    const pid = Number(playerId);

    const [player, setPlayer] = useState<Player | null>(null);
    const [log, setLog] = useState<StatLine[]>([]);
    const [totals, setTotals] = useState<StatTotals | null>(null);
    const [averages, setAverages] = useState<StatTotals | null>(null);
    const [splitsTotals, setSplitsTotals] = useState<Splits | null>(null);
    const [splitsAverages, setSplitsAverages] = useState<Splits | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [logSortKey, setLogSortKey] = useState<string | null>(null);
    const [logSortDir, setLogSortDir] = useState<"desc" | "asc" | null>(null);
    const [splitTotalsSortKey, setSplitTotalsSortKey] = useState<keyof StatTotals | "FG_PCT" | "FG3_PCT" | "FT_PCT" | null>(null);
    const [splitTotalsSortDir, setSplitTotalsSortDir] = useState<"desc" | "asc" | null>(null);
    const [splitAvgSortKey, setSplitAvgSortKey] = useState<keyof StatTotals | "FG_PCT" | "FG3_PCT" | "FT_PCT" | null>(null);
    const [splitAvgSortDir, setSplitAvgSortDir] = useState<"desc" | "asc" | null>(null);

    type StatColumnKey = keyof StatTotals | "FG_PCT" | "FG3_PCT" | "FT_PCT";
    const statColumns: Array<[StatColumnKey, string]> = [
        ["minutes", "MIN"],
        ["points", "PTS"],
        ["rebounds", "REB"],
        ["assists", "AST"],
        ["steals", "STL"],
        ["blocks", "BLK"],
        ["turnovers", "TOV"],
        ["fouls", "FLS"],
        ["FG", "FG"],
        ["FGA", "FGA"],
        ["FG_PCT", "FG%"],
        ["FG3", "FG3"],
        ["FGA3", "FGA3"],
        ["FG3_PCT", "3P%"],
        ["FT", "FT"],
        ["FTA", "FTA"],
        ["FT_PCT", "FT%"],
        ["PM", "PM"],
    ];
    const logColumns: Array<[string, string]> = [
        ["Date", "date"],
        ["Opp", "opponent"],
        ["Loc", "location"],
        ["MIN", "minutes"],
        ["PTS", "points"],
        ["REB", "rebounds"],
        ["AST", "assists"],
        ["STL", "steals"],
        ["BLK", "blocks"],
        ["TOV", "turnovers"],
        ["FLS", "fouls"],
        ["FG", "FG"],
        ["FGA", "FGA"],
        ["FG%", "FG_PCT"],
        ["FG3", "FG3"],
        ["FGA3", "FGA3"],
        ["3P%", "FG3_PCT"],
        ["FT", "FT"],
        ["FTA", "FTA"],
        ["FT%", "FT_PCT"],
        ["PM", "PM"],
    ];

    const pct = (made: number, attempts: number) =>
        attempts === 0 ? "" : `${((made / attempts) * 100).toFixed(1)}%`;

    const formatMinutes = (minutes: number) => {
        const totalSeconds = Math.floor(minutes * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const renderStatCell = (row: StatTotals, key: StatColumnKey) => {
        if (key === "FG_PCT") return pct(row.FG, row.FGA);
        if (key === "FG3_PCT") return pct(row.FG3, row.FGA3);
        if (key === "FT_PCT") return pct(row.FT, row.FTA);
        if (key === "minutes") return formatMinutes(row.minutes);
        return row[key];
    };

    const toggleSort = (
        key: string,
        currentKey: string | null,
        currentDir: "desc" | "asc" | null,
        setKey: (v: string | null) => void,
        setDir: (v: "desc" | "asc" | null) => void,
    ) => {
        if (currentKey !== key) {
            setKey(key);
            setDir("desc");
            return;
        }
        if (currentDir === "desc") setDir("asc");
        else if (currentDir === "asc") {
            setKey(null);
            setDir(null);
        } else {
            setDir("desc");
        }
    };

    const sortIndicator = (key: string, currentKey: string | null, currentDir: "desc" | "asc" | null) => {
        if (currentKey !== key || !currentDir) return "";
        return currentDir === "asc" ? " ^" : " v";
    };

    const getLogValue = (row: StatLine, key: string) => {
        switch (key) {
            case "FG_PCT":
                return row.FGA === 0 ? -1 : row.FG / row.FGA;
            case "FG3_PCT":
                return row.FGA3 === 0 ? -1 : row.FG3 / row.FGA3;
            case "FT_PCT":
                return row.FTA === 0 ? -1 : row.FT / row.FTA;
            case "date":
                return row.date;
            case "opponent":
                return row.opponent;
            case "location":
                return row.location;
            default:
                return (row as any)[key] ?? 0;
        }
    };

    const sortedLog = useMemo(() => {
        if (!logSortKey || !logSortDir) return log;
        const sorted = [...log].sort((a, b) => {
            const av = getLogValue(a, logSortKey);
            const bv = getLogValue(b, logSortKey);
            if (typeof av === "string" || typeof bv === "string") {
                const cmp = String(av).localeCompare(String(bv));
                return logSortDir === "desc" ? -cmp : cmp;
            }
            if (av === bv) return 0;
            return logSortDir === "desc" ? bv - av : av - bv;
        });
        return sorted;
    }, [log, logSortKey, logSortDir]);

    const sortSplitRows = (
        rows: SplitRow[],
        key: keyof StatTotals | "FG_PCT" | "FG3_PCT" | "FT_PCT" | null,
        dir: "desc" | "asc" | null,
    ) => {
        if (!key || !dir) return rows;
        const sorted = [...rows].sort((a, b) => {
            const av =
                key === "FG_PCT"
                    ? a.FGA === 0 ? -1 : a.FG / a.FGA
                    : key === "FG3_PCT"
                        ? a.FGA3 === 0 ? -1 : a.FG3 / a.FGA3
                        : key === "FT_PCT"
                            ? a.FTA === 0 ? -1 : a.FT / a.FTA
                            : (a as any)[key];
            const bv =
                key === "FG_PCT"
                    ? b.FGA === 0 ? -1 : b.FG / b.FGA
                    : key === "FG3_PCT"
                        ? b.FGA3 === 0 ? -1 : b.FG3 / b.FGA3
                        : key === "FT_PCT"
                            ? b.FTA === 0 ? -1 : b.FT / b.FTA
                            : (b as any)[key];
            if (av === bv) return 0;
            return dir === "desc" ? bv - av : av - bv;
        });
        return sorted;
    };

    async function load() {
        setErr(null);

        try {
            const [pRes, lRes, tRes, aRes, stRes, saRes] = await Promise.all([
                apiFetch(`/players/${pid}`),
                apiFetch(`/players/${pid}/game-log`),
                apiFetch(`/players/${pid}/totals`),
                apiFetch(`/players/${pid}/averages`),
                apiFetch(`/players/${pid}/splits/totals`),
                apiFetch(`/players/${pid}/splits/averages`),
            ]);

            if (pRes.status === 404) {
                setErr("Player not found");
                return;
            }
            if (!pRes.ok) throw new Error(await pRes.text());
            if (!lRes.ok) throw new Error(await lRes.text());
            if (!tRes.ok) throw new Error(await tRes.text());
            if (!aRes.ok) throw new Error(await aRes.text());
            if (!stRes.ok) throw new Error(await stRes.text());
            if (!saRes.ok) throw new Error(await saRes.text());

            setPlayer(await pRes.json());
            setLog(await lRes.json());
            setTotals(await tRes.json());
            setAverages(await aRes.json());
            setSplitsTotals(await stRes.json());
            setSplitsAverages(await saRes.json());
        } catch (e: any) {
            if (e.message === "Unauthorized") {
                clearToken();
                window.location.reload();
                return;
            }
            setErr("Failed to load player");
        }

    }

    useEffect(() => {
        if (!Number.isFinite(pid)) {
            setErr("Invalid player id");
            return;
        }
        load();
    }, [pid]);

    if (err) {
        return (
            <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui "}}>
                <h2>Player</h2>
                <p style={{ color: "crimson" }}>{err}</p>
            </div>
        );
    }

    if (!player) {
        return (
            <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui" }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>
                #{player.jersey_number} {player.name} <span style={{ color: "#666" }}>({player.position})</span>
            </h2>

            <h3 style={{ marginTop: 24 }}>Game Log</h3>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead>
                    <tr>
                        {logColumns.map(([label, key]) => (
                            <th
                                key={label}
                                style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: label === "Opp" ? "left" : "center", cursor: "pointer" }}
                                onClick={() => toggleSort(key, logSortKey, logSortDir, setLogSortKey, setLogSortDir)}
                            >
                                {label}
                                {sortIndicator(key, logSortKey, logSortDir)}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {sortedLog.map((r) => (
                        <tr key={r.game_id}>
                            {/* Clicking date goes to box score */}
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                <Link to={`/games/${r.game_id}`}>{r.date}</Link>
                            </td>

                            <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.opponent}</td>

                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                {r.location}
                            </td>

                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {formatMinutes(r.minutes)}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.points}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.rebounds}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.assists}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.steals}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.blocks}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.turnovers}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.fouls}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FG}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FGA}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {pct(r.FG, r.FGA)}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FG3}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FGA3}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {pct(r.FG3, r.FGA3)}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FT}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.FTA}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {pct(r.FT, r.FTA)}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center"}}>
                                {r.PM}
                            </td>
                        </tr>
                    ))}

                    {sortedLog.length === 0 && (
                        <tr>
                            <td colSpan={21} style={{ padding: 12, color: "#666" }}>
                                No games logged yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {totals && (
                <>
                    <h3 style={{ marginTop: 28 }}>Totals</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                                {statColumns.map(([, label]) => (
                                    <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {statColumns.map(([key]) => (
                                    <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                        {renderStatCell(totals, key)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            {averages && (
                <>
                    <h3 style={{ marginTop: 28 }}>Averages</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                                {statColumns.map(([, label]) => (
                                    <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {statColumns.map(([key]) => (
                                    <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                        {renderStatCell(averages, key)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            {splitsTotals && (
                <>
                    <h3 style={{ marginTop: 28 }}>Splits (Totals)</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "left" }}>Split</th>
                                {statColumns.map(([key, label]) => (
                                    <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                        <span
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                toggleSort(
                                                    key as string,
                                                    splitTotalsSortKey,
                                                    splitTotalsSortDir,
                                                    (v) => setSplitTotalsSortKey(v as any),
                                                    setSplitTotalsSortDir,
                                                )
                                            }
                                        >
                                            {label}
                                            {sortIndicator(key as string, splitTotalsSortKey, splitTotalsSortDir)}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={statColumns.length + 1} style={{ padding: 8, fontWeight: 700, background: "#f7f7f7" }}>
                                    Location
                                </td>
                            </tr>
                            {splitsTotals.location.map((row) => (
                                <tr key={`loc-${row.label}`}>
                                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.label}</td>
                                    {statColumns.map(([key]) => (
                                        <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                            {renderStatCell(row, key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={statColumns.length + 1} style={{ padding: 8, fontWeight: 700, background: "#f7f7f7" }}>
                                    Opponent
                                </td>
                            </tr>
                            {sortSplitRows(splitsTotals.opponents, splitTotalsSortKey, splitTotalsSortDir).map((row) => (
                                <tr key={`opp-${row.label}`}>
                                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.label}</td>
                                    {statColumns.map(([key]) => (
                                        <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                            {renderStatCell(row, key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {splitsAverages && (
                <>
                    <h3 style={{ marginTop: 28 }}>Splits (Averages)</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "left" }}>Split</th>
                                {statColumns.map(([key, label]) => (
                                    <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                        <span
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                toggleSort(
                                                    key as string,
                                                    splitAvgSortKey,
                                                    splitAvgSortDir,
                                                    (v) => setSplitAvgSortKey(v as any),
                                                    setSplitAvgSortDir,
                                                )
                                            }
                                        >
                                            {label}
                                            {sortIndicator(key as string, splitAvgSortKey, splitAvgSortDir)}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={statColumns.length + 1} style={{ padding: 8, fontWeight: 700, background: "#f7f7f7" }}>
                                    Location
                                </td>
                            </tr>
                            {splitsAverages.location.map((row) => (
                                <tr key={`loc-avg-${row.label}`}>
                                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.label}</td>
                                    {statColumns.map(([key]) => (
                                        <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                            {renderStatCell(row, key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={statColumns.length + 1} style={{ padding: 8, fontWeight: 700, background: "#f7f7f7" }}>
                                    Opponent
                                </td>
                            </tr>
                            {sortSplitRows(splitsAverages.opponents, splitAvgSortKey, splitAvgSortDir).map((row) => (
                                <tr key={`opp-avg-${row.label}`}>
                                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.label}</td>
                                    {statColumns.map(([key]) => (
                                        <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                            {renderStatCell(row, key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
