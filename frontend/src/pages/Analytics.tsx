import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { Link } from "react-router-dom";

type PlayerAnalytics = {
    player_id: number;
    name: string;
    jersey_number: number;
    position: string;
    gp: number;

    total_minutes: number;
    total_points: number;
    total_rebounds: number;
    total_assists: number;
    total_steals: number;
    total_blocks: number;
    total_turnovers: number;
    total_fouls: number;
    total_FG: number;
    total_FGA: number;
    total_FG3: number;
    total_FGA3: number;
    total_FT: number;
    total_FTA: number;
    total_PM: number;

    avg_minutes: number;
    avg_points: number;
    avg_rebounds: number;
    avg_assists: number;
    avg_steals: number;
    avg_blocks: number;
    avg_turnovers: number;
    avg_fouls: number;
    avg_FG: number;
    avg_FGA: number;
    avg_FG3: number;
    avg_FGA3: number;
    avg_FT: number;
    avg_FTA: number;
    avg_PM: number;
};

type LeaderRow = { player_id: number; name: string; jersey_number: number; value: number };
type Leaders = { minutes: LeaderRow[]; points: LeaderRow[]; rebounds: LeaderRow[]; assists: LeaderRow[]; steals: LeaderRow[]; blocks: LeaderRow[]; turnovers: LeaderRow[]; fouls: LeaderRow[]; FG: LeaderRow[]; FGA: LeaderRow[]; FG3: LeaderRow[]; FGA3: LeaderRow[]; FT: LeaderRow[]; FTA: LeaderRow[]; PM: LeaderRow[]; }

type TeamStats = {
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

type SplitRow = { label: string } & TeamStats;
type TeamSplits = { location: SplitRow[]; opponents: SplitRow[] };

export default function Analytics() {
    const [players, setPlayers] = useState<PlayerAnalytics[]>([]);
    const [leaders, setLeaders] = useState<Leaders | null>(null);
    const [teamTotals, setTeamTotals] = useState<TeamStats | null>(null);
    const [teamAverages, setTeamAverages] = useState<TeamStats | null>(null);
    const [teamSplitsTotals, setTeamSplitsTotals] = useState<TeamSplits | null>(null);
    const [teamSplitsAverages, setTeamSplitsAverages] = useState<TeamSplits | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [playerTotalsSortKey, setPlayerTotalsSortKey] = useState<string | null>(null);
    const [playerTotalsSortDir, setPlayerTotalsSortDir] = useState<"desc" | "asc" | null>(null);
    const [playerAvgSortKey, setPlayerAvgSortKey] = useState<string | null>(null);
    const [playerAvgSortDir, setPlayerAvgSortDir] = useState<"desc" | "asc" | null>(null);
    const [teamSplitsTotalsSortKey, setTeamSplitsTotalsSortKey] = useState<StatColumnKey | null>(null);
    const [teamSplitsTotalsSortDir, setTeamSplitsTotalsSortDir] = useState<"desc" | "asc" | null>(null);
    const [teamSplitsAvgSortKey, setTeamSplitsAvgSortKey] = useState<StatColumnKey | null>(null);
    const [teamSplitsAvgSortDir, setTeamSplitsAvgSortDir] = useState<"desc" | "asc" | null>(null);

    type StatColumnKey = keyof TeamStats | "FG_PCT" | "FG3_PCT" | "FT_PCT";
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

    const pct = (made: number, attempts: number) =>
        attempts === 0 ? "" : `${((made / attempts) * 100).toFixed(1)}%`;

    const formatMinutes = (minutes: number) => {
        const totalSeconds = Math.floor(minutes * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const renderStatCell = (row: TeamStats, key: StatColumnKey) => {
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

    const getPlayerValue = (p: PlayerAnalytics, key: string) => {
        switch (key) {
            case "FG_PCT":
                return p.total_FGA === 0 ? -1 : p.total_FG / p.total_FGA;
            case "FG3_PCT":
                return p.total_FGA3 === 0 ? -1 : p.total_FG3 / p.total_FGA3;
            case "FT_PCT":
                return p.total_FTA === 0 ? -1 : p.total_FT / p.total_FTA;
            case "avg_FG_PCT":
                return p.avg_FGA === 0 ? -1 : p.avg_FG / p.avg_FGA;
            case "avg_FG3_PCT":
                return p.avg_FGA3 === 0 ? -1 : p.avg_FG3 / p.avg_FGA3;
            case "avg_FT_PCT":
                return p.avg_FTA === 0 ? -1 : p.avg_FT / p.avg_FTA;
            default:
                return (p as any)[key] ?? 0;
        }
    };

    const sortedPlayerTotals = useMemo(() => {
        if (!playerTotalsSortKey || !playerTotalsSortDir) return players;
        const sorted = [...players].sort((a, b) => {
            const av = getPlayerValue(a, playerTotalsSortKey);
            const bv = getPlayerValue(b, playerTotalsSortKey);
            if (typeof av === "string" || typeof bv === "string") {
                const cmp = String(av).localeCompare(String(bv));
                return playerTotalsSortDir === "desc" ? -cmp : cmp;
            }
            if (av === bv) return 0;
            return playerTotalsSortDir === "desc" ? bv - av : av - bv;
        });
        return sorted;
    }, [players, playerTotalsSortKey, playerTotalsSortDir]);

    const sortedPlayerAverages = useMemo(() => {
        if (!playerAvgSortKey || !playerAvgSortDir) return players;
        const sorted = [...players].sort((a, b) => {
            const av = getPlayerValue(a, playerAvgSortKey);
            const bv = getPlayerValue(b, playerAvgSortKey);
            if (typeof av === "string" || typeof bv === "string") {
                const cmp = String(av).localeCompare(String(bv));
                return playerAvgSortDir === "desc" ? -cmp : cmp;
            }
            if (av === bv) return 0;
            return playerAvgSortDir === "desc" ? bv - av : av - bv;
        });
        return sorted;
    }, [players, playerAvgSortKey, playerAvgSortDir]);

    const sortSplitRows = (
        rows: SplitRow[],
        key: StatColumnKey | null,
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

        const [pRes, lRes, ttRes, taRes, tstRes, tsaRes] = await Promise.all([
            apiFetch("/analytics/players"),
            apiFetch("/analytics/leaders?limit=5"),
            apiFetch("/analytics/team/totals"),
            apiFetch("/analytics/team/averages"),
            apiFetch("/analytics/team/splits/totals"),
            apiFetch("/analytics/team/splits/averages"),
        ]);

        if (!pRes.ok) return setErr("Failed to load player analytics");
        if (!lRes.ok) return setErr("Failed to load leaders");
        if (!ttRes.ok) return setErr("Failed to load team totals");
        if (!taRes.ok) return setErr("Failed to load team averages");
        if (!tstRes.ok) return setErr("Failed to load team splits totals");
        if (!tsaRes.ok) return setErr("Failed to load team splits averages");

        setPlayers(await pRes.json());
        setLeaders(await lRes.json());
        setTeamTotals(await ttRes.json());
        setTeamAverages(await taRes.json());
        setTeamSplitsTotals(await tstRes.json());
        setTeamSplitsAverages(await tsaRes.json());
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Analytics</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
            
            {leaders && (
                <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
                    <Leaderboard title="Minutes Leaders" rows={leaders.minutes} />
                    <Leaderboard title="Points Leaders" rows={leaders.points} />
                    <Leaderboard title="Rebounds Leaders" rows={leaders.rebounds} />
                    <Leaderboard title="Assists Leaders" rows={leaders.assists} />
                    <Leaderboard title="Steals Leaders" rows={leaders.steals} />
                    <Leaderboard title="Blocks Leaders" rows={leaders.blocks} />
                    <Leaderboard title="Turnovers Leaders" rows={leaders.turnovers} />
                    <Leaderboard title="Fouls Leaders" rows={leaders.fouls} />
                    <Leaderboard title="FG Leaders" rows={leaders.FG} />
                    <Leaderboard title="FGA Leaders" rows={leaders.FGA} />
                    <Leaderboard title="FG3 Leaders" rows={leaders.FG3} />
                    <Leaderboard title="FGA3 Leaders" rows={leaders.FGA3} />
                    <Leaderboard title="FT Leaders" rows={leaders.FT} />
                    <Leaderboard title="FTA Leaders" rows={leaders.FTA} />
                    <Leaderboard title="PM Leaders" rows={leaders.PM} />
                </div>
            )}

            {teamTotals && (
                <>
                    <h3 style={{ marginTop: 28 }}>Team Totals</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                    {statColumns.map(([key, label]) => (
                        <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                            <span
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    toggleSort(
                                        key as string,
                                        teamSplitsTotalsSortKey as string | null,
                                        teamSplitsTotalsSortDir,
                                        (v) => setTeamSplitsTotalsSortKey(v as StatColumnKey | null),
                                        setTeamSplitsTotalsSortDir,
                                    )
                                }
                            >
                                {label}
                                {sortIndicator(key as string, teamSplitsTotalsSortKey as string | null, teamSplitsTotalsSortDir)}
                            </span>
                        </th>
                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {statColumns.map(([key]) => (
                                    <td key={key} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                        {renderStatCell(teamTotals, key)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            {teamAverages && (
                <>
                    <h3 style={{ marginTop: 28 }}>Team Averages</h3>
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
                                        {renderStatCell(teamAverages, key)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            {teamSplitsTotals && (
                <>
                    <h3 style={{ marginTop: 28 }}>Team Splits (Totals)</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "left" }}>Split</th>
                                {statColumns.map(([, label]) => (
                                    <th key={label} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                        {label}
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
                            {teamSplitsTotals.location.map((row) => (
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
                            {sortSplitRows(teamSplitsTotals.opponents, teamSplitsTotalsSortKey, teamSplitsTotalsSortDir).map((row) => (
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

            {teamSplitsAverages && (
                <>
                    <h3 style={{ marginTop: 28 }}>Team Splits (Averages)</h3>
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
                                        teamSplitsAvgSortKey as string | null,
                                        teamSplitsAvgSortDir,
                                        (v) => setTeamSplitsAvgSortKey(v as StatColumnKey | null),
                                        setTeamSplitsAvgSortDir,
                                    )
                                }
                            >
                                {label}
                                {sortIndicator(key as string, teamSplitsAvgSortKey as string | null, teamSplitsAvgSortDir)}
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
                            {teamSplitsAverages.location.map((row) => (
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
                            {sortSplitRows(teamSplitsAverages.opponents, teamSplitsAvgSortKey, teamSplitsAvgSortDir).map((row) => (
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
            
            <h3 style={{ marginTop: 28 }}>Player Totals</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead>
                    <tr>
                    {[
                        ["Player", "name"],
                        ["GP", "gp"],
                        ["MIN", "total_minutes"],
                        ["PTS", "total_points"],
                        ["REB", "total_rebounds"],
                        ["AST", "total_assists"],
                        ["STL", "total_steals"],
                        ["BLK", "total_blocks"],
                        ["TO", "total_turnovers"],
                        ["FLS", "total_fouls"],
                        ["FG", "total_FG"],
                        ["FGA", "total_FGA"],
                        ["FG%", "FG_PCT"],
                        ["FG3", "total_FG3"],
                        ["FGA3", "total_FGA3"],
                        ["3P%", "FG3_PCT"],
                        ["FT", "total_FT"],
                        ["FTA", "total_FTA"],
                        ["FT%", "FT_PCT"],
                        ["PM", "total_PM"],
                    ].map(([label, key]) => (
                        <th
                            key={label}
                            style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: label === "Player" ? "left" : "center", cursor: "pointer" }}
                            onClick={() => toggleSort(key as string, playerTotalsSortKey, playerTotalsSortDir, setPlayerTotalsSortKey, setPlayerTotalsSortDir)}
                        >
                            {label}
                            {sortIndicator(key as string, playerTotalsSortKey, playerTotalsSortDir)}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayerTotals.map((p) => (
                        <tr key={p.player_id}>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                                <Link to={`/players/${p.player_id}`}>
                                    #{p.jersey_number} {p.name} <span style={{ color: "#666" }}>({p.position})</span>
                                    </Link>
                                </td>

                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.gp}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_minutes}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_points}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_rebounds}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_assists}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_steals}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_blocks}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_turnovers}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_fouls}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FG}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FGA}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.total_FG, p.total_FGA)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FG3}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FGA3}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.total_FG3, p.total_FGA3)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FT}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_FTA}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.total_FT, p.total_FTA)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.total_PM}</td>
                        </tr>
                    ))}

                    {players.length === 0 && (
                        <tr>
                            <td colSpan={20} style={{ padding: 12, color: "#666" }}>
                                No analytics yet (add stat lines first).
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <h3 style={{ marginTop: 28 }}>Player Averages</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead>
                    <tr>
                    {[
                        ["Player", "name"],
                        ["GP", "gp"],
                        ["MIN", "avg_minutes"],
                        ["PTS", "avg_points"],
                        ["REB", "avg_rebounds"],
                        ["AST", "avg_assists"],
                        ["STL", "avg_steals"],
                        ["BLK", "avg_blocks"],
                        ["TO", "avg_turnovers"],
                        ["FLS", "avg_fouls"],
                        ["FG", "avg_FG"],
                        ["FGA", "avg_FGA"],
                        ["FG%", "avg_FG_PCT"],
                        ["FG3", "avg_FG3"],
                        ["FGA3", "avg_FGA3"],
                        ["3P%", "avg_FG3_PCT"],
                        ["FT", "avg_FT"],
                        ["FTA", "avg_FTA"],
                        ["FT%", "avg_FT_PCT"],
                        ["PM", "avg_PM"],
                    ].map(([label, key]) => (
                        <th
                            key={label}
                            style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: label === "Player" ? "left" : "center", cursor: "pointer" }}
                            onClick={() => toggleSort(key as string, playerAvgSortKey, playerAvgSortDir, setPlayerAvgSortKey, setPlayerAvgSortDir)}
                        >
                            {label}
                            {sortIndicator(key as string, playerAvgSortKey, playerAvgSortDir)}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayerAverages.map((p) => (
                        <tr key={`${p.player_id}-avg`}>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                                <Link to={`/players/${p.player_id}`}>
                                    #{p.jersey_number} {p.name} <span style={{ color: "#666" }}>({p.position})</span>
                                </Link>
                            </td>

                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.gp}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{formatMinutes(p.avg_minutes)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_points}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_rebounds}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_assists}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_steals}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_blocks}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_turnovers}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_fouls}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FG}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FGA}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.avg_FG, p.avg_FGA)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FG3}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FGA3}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.avg_FG3, p.avg_FGA3)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FT}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_FTA}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{pct(p.avg_FT, p.avg_FTA)}</td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_PM}</td>
                        </tr>
                    ))}

                    {players.length === 0 && (
                        <tr>
                            <td colSpan={20} style={{ padding: 12, color: "#666" }}>
                                No analytics yet (add stat lines first).
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function Leaderboard({ title, rows }: { title: string; rows: LeaderRow[] }) {
    return (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minWidth: 240 }}>
            <h4 style={{ marginTop: 0 }}>{title}</h4>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
                {rows.map((r) => (
                    <li key={r.player_id} style={{ marginBottom: 6 }}>
                        #{r.jersey_number} {r.name}: <strong>{r.value}</strong>
                    </li>
                ))}
            </ol>
        </div>
    );
}
