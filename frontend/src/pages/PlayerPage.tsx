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

    const pct = (made: number, attempts: number) =>
        attempts === 0 ? "" : `${((made / attempts) * 100).toFixed(1)}%`;

    const formatMinutes = (minutes: number) => {
        const totalSeconds = Math.round(minutes * 60);
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
                        {["Date", "Opp", "Loc", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV", "FLS", "FG", "FGA", "FG%", "FG3", "FGA3", "3P%", "FT", "FTA", "FT%", "PM"].map((h) => (
                            <th
                                key={h}
                                style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: h === "Opp" ? "left" : "center" }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {log.map((r) => (
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

                    {log.length === 0 && (
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
                            {splitsTotals.opponents.map((row) => (
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
                            {splitsAverages.opponents.map((row) => (
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
