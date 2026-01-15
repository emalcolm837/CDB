import { useEffect, useState } from "react";
import { apiFetch, getRole } from "../api";

type Player = { id: number; name: string; jersey_number: number; position: string };
type Game = { id: number; date: string; opponent: string; location: string };
type StatLine = {
    id: number;
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
};

export default function Stats() {
    const role = getRole();
    const isAdmin = role === "admin";

    const [players, setPlayers] = useState<Player[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

    const [statlines, setStatlines] = useState<StatLine[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const [playerId, setPlayerId] = useState<number | null>(null);
    const [minutes, setMinutes] = useState<string>("");
    const [points, setPoints] = useState<string>("");
    const [rebounds, setRebounds] = useState<string>("");
    const [assists, setAssists] = useState<string>("");
    const [steals, setSteals] = useState<string>("");
    const [blocks, setBlocks] = useState<string>("");
    const [turnovers, setTurnovers] = useState<string>("");
    const [fouls, setFouls] = useState<string>("");
    const [FG, setFG] = useState<string>("");
    const [FGA, setFGA] = useState<string>("");
    const [FG3, setFG3] = useState<string>("");
    const [FGA3, setFGA3] = useState<string>("");
    const [FT, setFT] = useState<string>("");
    const [FTA, setFTA] = useState<string>("");
    const [PM, setPM] = useState<string>("");

    async function loadBasics() {
        const [pRes, gRes] = await Promise.all([apiFetch("/players/"), apiFetch("/games/")]);
        const playersData = await pRes.json();
        const gamesData = await gRes.json();

        setPlayers(playersData);
        setGames(gamesData);

        if (gamesData.length > 0 && selectedGameId == null) setSelectedGameId(gamesData[0].id);
        if (playersData.length > 0 && playerId == null) setPlayerId(playersData[0].id);
    }

    async function loadStatlines(gameId: number) {
        setErr(null);
        const res = await apiFetch(`/stat-lines/by-game/${gameId}`);
        if (!res.ok) {
            setErr("Failed to load stat lines for game");
            setStatlines([]);
            return;
        }
        setStatlines(await res.json());
    }

    useEffect(() => {
        loadBasics();
    }, []);

    useEffect(() => {
        if (selectedGameId != null) loadStatlines(selectedGameId);
    }, [selectedGameId]);

    async function createStatline() {
        if (!isAdmin) {
            setErr("Admin permission required.");
            return;
        }
        if (selectedGameId == null || playerId == null) {
            setErr("Pick a game and player first.");
            return;
        }

        const toInt = (s: string) => (s.trim() === "" ? 0 : Number(s));

        const payload = {
            player_id: playerId,
            game_id: selectedGameId,
            minutes: toInt(minutes),
            points: toInt(points),
            rebounds: toInt(rebounds),
            assists: toInt(assists),
            steals: toInt(steals),
            blocks: toInt(blocks),
            turnovers: toInt(turnovers),
            fouls: toInt(fouls),
            FG: toInt(FG),
            FGA: toInt(FGA),
            FG3: toInt(FG3),
            FGA3: toInt(FGA3),
            FT: toInt(FT),
            FTA: toInt(FTA),
            PM: toInt(PM),
        };

        const res = await apiFetch("/stat-lines/", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (res.status === 403) {
            setErr("Admin permission required.");
            return;
        }
        if (!res.ok) {
            setErr("Create statline failed (maybe duplicate for that player/game).");
            return;
        }

        setMinutes(""); setPoints(""); setRebounds(""); setAssists(""); 
        setSteals(""); setBlocks(""); setTurnovers(""); setFouls("");
        setFG(""); setFGA(""); setFG3(""); setFGA3(""); setFT(""); setFTA(""); setPM("");
        await loadStatlines(selectedGameId);
    }

    async function deleteStatline(pid: number, gid: number) {
        setErr(null);
        const res = await apiFetch(`/stat-lines/by-player/${pid}/by-game/${gid}`, {
            method: "DELETE",
        });

        if (res.status === 403) {
            setErr("Admin permission required.");
            return;
        }
        if (!res.ok) {
            setErr("Delete statline failed.");
            return;
        }
        if (selectedGameId != null) await loadStatlines(selectedGameId);
    }

    function playerLabel(pid: number) {
        const p = players.find((x) => x.id === pid);
        return p ? `#${p.jersey_number} ${p.name}` : `Player ${pid}`;
    }

    return (
        <div style={{ maxWidth: 920, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Stats</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <label>Game:</label>
                <select
                    value={selectedGameId ?? ""}
                    onChange={(e) => {
                        const v = e.target.value;
                        setSelectedGameId(v === "" ? null : Number(v));
                    }}
                >
                    {games.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.date} vs {g.opponent} ({g.location})
                        </option>
                    ))}
                </select>
            </div>

            {isAdmin && (
                <>
                    <h3 style={{ marginTop: 24 }}>Add stat line (admin)</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <select
                            value={playerId ?? ""}
                            onChange={(e) => {
                                const v = e.target.value;
                                setPlayerId(v === "" ? null : Number(v));
                            }}
                        >
                            <option value="" disabled>Select Player</option>
                            {players.map((p) => (
                                <option key={p.id} value={p.id}>
                                    #{p.jersey_number} {p.name} ({p.position})
                                </option>
                            ))}
                        </select>
                            
                        <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="MIN" />
                        <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="PTS" />
                        <input type="number" value={rebounds} onChange={(e) => setRebounds(e.target.value)} placeholder="REB" />
                        <input type="number" value={assists} onChange={(e) => setAssists(e.target.value)} placeholder="AST" />
                        <input type="number" value={steals} onChange={(e) => setSteals(e.target.value)} placeholder="STL" />
                        <input type="number" value={blocks} onChange={(e) => setBlocks(e.target.value)} placeholder="BLK" />
                        <input type="number" value={turnovers} onChange={(e) => setTurnovers(e.target.value)} placeholder="TO" />
                        <input type="number" value={fouls} onChange={(e) => setFouls(e.target.value)} placeholder="FLS" />   
                        <input type="number" value={FG} onChange={(e) => setFG(e.target.value)} placeholder="FG" />
                        <input type="number" value={FGA} onChange={(e) => setFGA(e.target.value)} placeholder="FGA" />
                        <input type="number" value={FG3} onChange={(e) => setFG3(e.target.value)} placeholder="FG3" />
                        <input type="number" value={FGA3} onChange={(e) => setFGA3(e.target.value)} placeholder="FGA3" />
                        <input type="number" value={FT} onChange={(e) => setFT(e.target.value)} placeholder="FT" />
                        <input type="number" value={FTA} onChange={(e) => setFTA(e.target.value)} placeholder="FTA" />
                        <input type="number" value={PM} onChange={(e) => setPM(e.target.value)} placeholder="PM" />
                        <button onClick={createStatline}>Save</button>                     
                    </div>
                </>
            )}

            <h3 style={{ marginTop: 24 }}>Stat lines</h3>
            <ul>
                {statlines.map((s) => (
                    <li key={s.id}>
                        {playerLabel(s.player_id)} - MIN {s.minutes}, PTS {s.points}, REB {s.rebounds}, AST {s.assists}, STL {s.steals}, BLK {s.blocks}, TO {s.turnovers}, FLS {s.fouls}, FG {s.FG}, FGA {s.FGA}, FG3 {s.FG3}, FGA3 {s.FGA3}, FT {s.FT}, FTA {s.FTA}, PM {s.PM}
                        {isAdmin && (
                            <button style={{ marginLeft: 10 }} onClick={() => deleteStatline(s.player_id, s.game_id)}>
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
