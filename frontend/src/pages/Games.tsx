import { useEffect, useState } from "react";
import { apiFetch, getRole } from "../api";
import { Link } from "react-router-dom"

type Game = {
    id: number;
    date: string;
    opponent: string;
    location: string;
};

export default function Games() {
    const [games, setGames] = useState<Game[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const role = getRole();
    const isAdmin = role === "admin";

    const [date, setDate] = useState("");
    const [opponent, setOpponent] = useState("");
    const [location, setLocation] = useState("Home");

    async function loadGames() {
        setErr(null);
        const res = await apiFetch("/games/");
        if (!res.ok) {
            setErr("Failed to load games");
            return;
        }
        setGames(await res.json());
    }

    useEffect(() => {
        loadGames();
    }, []);

    async function createGame() {
        setErr(null);

        const res = await apiFetch("/games/", {
            method: "POST",
            body: JSON.stringify({ date, opponent, location })
        });

        if (res.status === 409 || res.status === 400) {
            setErr("That game already exists (duplicate).");
            return;
        }

        if (!res.ok) {
            setErr("Create game failed.");
            return;
        }

        setDate("");
        setOpponent("");
        setLocation("Home");
        await loadGames();
    }

    async function deleteGame(gameId: number) {
        setErr(null);
        const res = await apiFetch(`/games/${gameId}`, { method: "DELETE" });

        if (res.status === 403) {
            setErr("Admin permission required.");
            return;
        }
        if (!res.ok) {
            setErr("Delete failed.");
            return;
        }
        await loadGames();
    }

    return (
        <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Games</h2>

            {err && <p style={{ color: "crimson" }}>{err}</p>}

            {isAdmin && (
                <>
                    <h3 style={{ marginTop: 24 }}>Add game (admin)</h3>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input
                            placeholder="YYYY-MM-DD"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <input
                            placeholder="Opponent"
                            value={opponent}
                            onChange={(e) => setOpponent(e.target.value)}
                        />
                        <select value={location} onChange={(e) => setLocation(e.target.value)}>
                            <option>Home</option>
                            <option>Away</option>
                        </select>
                        <button onClick={createGame}>Create</button>
                    </div>
                </>
            )}

            <h3>Schedule</h3>
            <ul>
                {games.map((g) => (
                    <li key={g.id}>
                        <Link to={`/games/${g.id}`}>
                            {g.date} - {g.opponent} ({g.location})
                        </Link>
                        {isAdmin && (
                            <button style={{ marginLeft: 10 }} onClick={() => deleteGame(g.id)}>
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}