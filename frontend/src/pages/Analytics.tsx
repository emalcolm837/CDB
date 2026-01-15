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
        const totalSeconds = Math.round(minutes * 60);
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
                            {teamSplitsTotals.opponents.map((row) => (
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
                            {teamSplitsAverages.opponents.map((row) => (
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
            
            <h3 style={{ marginTop: 28}}>Player Totals & Averages</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <thead>
                    <tr>
                    {["Player", "GP", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TO", "FLS", "FG", "FGA", "FG%", "FG3", "FGA3", "3P%", "FT", "FTA", "FT%", "PM", "PTS/G", "REB/G", "AST/G"].map((h) => (
                        <th key={h} style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: h === "Player" ? "left" : "center" }}>
                            {h}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {players.map((p) => (
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
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_points}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_rebounds}</td>
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>{p.avg_assists}</td>
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
