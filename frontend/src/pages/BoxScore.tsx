import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, getRole } from "../api";

type Player = { id: number; name: string; jersey_number: number; position: string };
type Statline = {
    id?: number;
    player_id: number;
    game_id: number;
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
    starter?: number;
};

type RowInput = {
    player_id: number;
    starter: string;
    minutes: string;
    points: string;
    rebounds: string;
    assists: string;
    steals: string;
    blocks: string;
    turnovers: string;
    fouls: string;
    FG: string;
    FGA: string;
    FG3: string;
    FGA3: string;
    FT: string;
    FTA: string;
    PM: string;
};

type SortDir = "desc" | "asc" | null;
type SortKey = keyof Omit<RowInput, "player_id">;

const toStr = (n: number) => (n === 0 ? "" : String(n));
const toInt = (s: string) => (s.trim() === "" ? 0 : Number(s));
const pct = (made: number, attempts: number) =>
    attempts === 0 ? "" : `${((made / attempts) * 100).toFixed(1)}%`;
const formatMinutes = (minutes: number) => {
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};
const parseMinutes = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") return 0;
    if (trimmed.includes(":")) {
        const [mm, ss] = trimmed.split(":");
        const mins = Number(mm);
        const secs = Number(ss);
        if (Number.isNaN(mins) || Number.isNaN(secs)) return 0;
        return mins + secs / 60;
    }
    const mins = Number(trimmed);
    return Number.isNaN(mins) ? 0 : mins;
};

export default function BoxScore() {
    const { gameId } = useParams();
    const gid = Number(gameId);

    const role = getRole();
    const isAdmin = role === "admin";

    const [players, setPlayers] = useState<Player[]>([]);
    const [statlines, setStatlines] = useState<Statline[]>([]);
    const [rows, setRows] = useState<RowInput[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    async function load() {
        setErr(null);

        const [pRes, sRes] = await Promise.all([
            apiFetch("/players/"),
            apiFetch(`/stat-lines/by-game/${gid}`),
        ]);

        if (!pRes.ok) return setErr("Failed to load players");
        if (!sRes.ok) return setErr("Failed to load box score");

        setPlayers(await pRes.json());
        setStatlines(await sRes.json());
    }

    useEffect(() => {
        if (!Number.isFinite(gid)) {
            setErr("Invalid game id");
            return;
        }
        load();
    }, [gid]);

    useEffect(() => {
        const byPid = new Map<number, Statline>();
        for (const sl of statlines) byPid.set(sl.player_id, sl);

        const newRows: RowInput[] = players.map((pl, index) => {
            const sl = byPid.get(pl.id);
            return {
                player_id: pl.id,
                starter: sl ? String(sl.starter ?? 0) : index < 5 ? "1" : "0",
                minutes: sl ? formatMinutes(sl.minutes) : "",
                points: sl ? toStr(sl.points) : "",
                rebounds: sl ? toStr(sl.rebounds) : "",
                assists: sl ? toStr(sl.assists) : "",
                steals: sl ? toStr(sl.steals) : "",
                blocks: sl ? toStr(sl.blocks) : "",
                turnovers: sl ? toStr(sl.turnovers) : "",
                fouls: sl ? toStr(sl.fouls) : "",
                FG: sl ? toStr(sl.FG) : "",
                FGA: sl ? toStr(sl.FGA) : "",
                FG3: sl ? toStr(sl.FG3) : "",
                FGA3: sl ? toStr(sl.FGA3) : "",
                FT: sl ? toStr(sl.FT) : "",
                FTA: sl ? toStr(sl.FTA) : "",
                PM: sl ? toStr(sl.PM) : "",
            };
        });

        setRows(newRows);
    }, [players, statlines]);

    function toggleSort(key: SortKey) {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("desc");
            return;
        }
        if (sortDir === "desc") setSortDir("asc");
        else if (sortDir === "asc") {
            setSortKey(null);
            setSortDir(null);
        } else {
            setSortDir("desc");
        }
    }

    const sortIndicator = (key: SortKey) => {
        if (sortKey !== key || !sortDir) return "";
        return sortDir === "asc" ? " ^" : " v";
    };

    function setCell(playerId: number, key: keyof Omit<RowInput, "player_id">, value: string) {
        setRows((prev) =>
            prev.map((r) => (r.player_id === playerId ? { ...r, [key]: value } : r))
        );
    }

    async function saveRow(playerId: number) {
        setErr(null);
        const row = rows.find((r) => r.player_id === playerId);
        if (!row) return;

        const payload = {
            player_id: playerId,
            game_id: gid,
            minutes: parseMinutes(row.minutes),
            points: toInt(row.points),
            rebounds: toInt(row.rebounds),
            assists: toInt(row.assists),
            steals: toInt(row.steals),
            blocks: toInt(row.blocks),
            turnovers: toInt(row.turnovers),
            fouls: toInt(row.fouls),
            FG: toInt(row.FG),
            FGA: toInt(row.FGA),
            FG3: toInt(row.FG3),
            FGA3: toInt(row.FGA3),
            FT: toInt(row.FT),
            FTA: toInt(row.FTA),
            PM: toInt(row.PM),
            starter: Number(row.starter),
        };

        const res = await apiFetch("/stat-lines/upsert", {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        if (res.status === 403) {
            setErr("Admin permission required.");
            return;
        }
        if (!res.ok) {
            const msg = await res.text();
            setErr(msg || "Save failed.");
            return;
        }

        await load();
    }

    const byPlayerId = useMemo(() => {
        const m = new Map<number, Player>();
        for (const p of players) m.set(p.id, p);
        return m;
    }, [players]);

    const displayRows = useMemo(() => {
        if (!sortKey || !sortDir) return rows;

        const sorted = [...rows].sort((a, b) => {
            const av = Number(a[sortKey] || 0);
            const bv = Number(b[sortKey] || 0);
            if (av === bv) return 0;
            return sortDir === "desc" ? bv - av : av - bv;
        });

        return sorted;
    }, [rows, sortKey, sortDir]);

    const groupedRows = useMemo(() => {
        const starters = displayRows.filter((r) => r.starter === "1");
        const bench = displayRows.filter((r) => r.starter !== "1");
        return { starters, bench };
    }, [displayRows]);

    const teamTotals = useMemo(() => {
        return statlines.reduce(
            (acc, s) => {
                acc.minutes += s.minutes;
                acc.points += s.points;
                acc.rebounds += s.rebounds;
                acc.assists += s.assists;
                acc.steals += s.steals;
                acc.blocks += s.blocks;
                acc.turnovers += s.turnovers;
                acc.fouls += s.fouls;
                acc.FG += s.FG;
                acc.FGA += s.FGA;
                acc.FG3 += s.FG3;
                acc.FGA3 += s.FGA3;
                acc.FT += s.FT;
                acc.FTA += s.FTA;
                acc.PM += s.PM;
                return acc;
            },
            { minutes: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, FG: 0, FGA: 0, FG3: 0, FGA3: 0, FT: 0, FTA: 0, PM: 0 }
        );
    }, [statlines]);

    if (err) {
        return (
            <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui" }}>
                <h2>Box Score</h2>
                <p style={{ color: "crimson" }}>{err}</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Box Score (Game {gid})</h2>

            {!isAdmin && (
                <p style={{ color: "#666" }}>
                    Viewer mode: you can view box scores. Admins can edit via the Stats entry workflow.
                </p>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Player</th>
                        <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Role</th>
                        {[
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
                            ["FG3", "FG3"],
                            ["FGA3", "FGA3"],
                            ["FT", "FT"],
                            ["FTA", "FTA"],
                            ["PM", "PM"],
                        ].map(([label, key]) => (
                            <th
                                key={label}
                                style={{ borderBottom: "1px solid #ccc", padding: 8, cursor: "pointer" }}
                                onClick={() => toggleSort(key as SortKey)}
                            >
                                {label}
                                {sortIndicator(key as SortKey)}
                            </th>
                        ))}
                        {isAdmin && <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Save</th>}
                    </tr>
                </thead>
                <tbody>
                    {(["starters", "bench"] as const).map((group) => (
                        <Fragment key={group}>
                            <tr>
                                <td colSpan={isAdmin ? 18 : 17} style={{ padding: 8, fontWeight: 700, background: "#f7f7f7" }}>
                                    {group === "starters" ? "Starters" : "Bench"}
                                </td>
                            </tr>

                            {groupedRows[group].map((r) => {
                                const p = byPlayerId.get(r.player_id);
                                if (!p) return null;

                                const cellStyle: React.CSSProperties = { padding: 6, borderBottom: "1px solid #eee", textAlign: "center" };
                                const inputStyle: React.CSSProperties = { width: 64, padding: 6 };

                                return (
                                    <tr key={r.player_id}>
                                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                                            <Link to={`/players/${p.id}`}>#{p.jersey_number} {p.name}</Link>
                                        </td>
                                        <td style={cellStyle}>
                                            {isAdmin ? (
                                                <select
                                                    value={r.starter}
                                                    onChange={(e) => setCell(r.player_id, "starter", e.target.value)}
                                                >
                                                    <option value="1">Starter</option>
                                                    <option value="0">Bench</option>
                                                </select>
                                            ) : (
                                                <span>{r.starter === "1" ? "Starter" : "Bench"}</span>
                                            )}
                                        </td>

                                        {(
                                            [
                                                ["minutes", "MIN"],
                                                ["points", "PTS"],
                                                ["rebounds", "REB"],
                                                ["assists", "AST"],
                                                ["steals", "STL"],
                                                ["blocks", "BLK"],
                                                ["turnovers", "TO"],
                                                ["fouls", "FLS"],
                                                ["FG", "FG"],
                                                ["FGA", "FGA"],
                                                ["FG3", "FG3"],
                                                ["FGA3", "FGA3"],
                                                ["FT", "FT"],
                                                ["FTA", "FTA"],
                                                ["PM", "PM"],
                                            ] as const
                                        ).map(([key, label]) => (
                                            <td key={key} style={cellStyle}>
                                                <input
                                                    type={key === "minutes" ? "text" : "number"}
                                                    placeholder={key === "minutes" ? "MM:SS" : label}
                                                    value={r[key]}
                                                    disabled={!isAdmin}
                                                    onChange={(e) => setCell(r.player_id, key, e.target.value)}
                                                    style={inputStyle}
                                                />
                                            </td>
                                        ))}

                                        {isAdmin && (
                                            <td style={{ padding: 6, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                                <button onClick={() => saveRow(r.player_id)}>Save</button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </Fragment>
                    ))}

                    <tr>
                        <td style={{ padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>Team Totals</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{formatMinutes(teamTotals.minutes)}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.points}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.rebounds}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.assists}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.steals}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.blocks}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.turnovers}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.fouls}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FG}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FGA}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FG3}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FGA3}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FT}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.FTA}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "2px solid #ccc", fontWeight: 700 }}>{teamTotals.PM}</td>
                        {isAdmin && <td style={{ padding: 8, borderTop: "2px solid #ccc" }} />}
                    </tr>
                    <tr>
                        <td style={{ padding: 8, borderTop: "1px solid #ddd", fontWeight: 700 }}>Percentages</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }}>{pct(teamTotals.FG, teamTotals.FGA)}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }}>{pct(teamTotals.FG3, teamTotals.FGA3)}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }}>{pct(teamTotals.FT, teamTotals.FTA)}</td>
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        <td style={{ textAlign: "center", padding: 8, borderTop: "1px solid #ddd" }} />
                        {isAdmin && <td style={{ padding: 8, borderTop: "1px solid #ddd" }} />}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
