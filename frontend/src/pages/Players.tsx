import { useEffect, useMemo, useState } from "react";
import { apiFetch, clearToken, getRole } from "../api";
import { Link } from "react-router-dom";

type Player = { id: number; name: string; jersey_number: number; position: string};
type SortDir = "desc" | "asc" | null;
type PlayerSortKey = "name" | "jersey_number" | "position";

export default function Players() {
    const [sortKey, setSortKey] = useState<PlayerSortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const isAdmin = getRole() === "admin";

    const [players, setPlayers] = useState<Player[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [jersey, setJersey] = useState<number>(0);
    const [pos, setPos] = useState("PG");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editJersey, setEditJersey] = useState<string>("");
    const [editPos, setEditPos] = useState("");

    async function load() {
        setErr(null);
        try {
            const res = await apiFetch("/players/");
            if (!res.ok) {
                const msg = await res.text();
                setErr(msg || `Failed to load players (${res.status})`);
                return;
            }
            const data = await res.json();
            setPlayers(data);
        } catch (e: any) {
            if (e.message === "Unauthorized") {
                clearToken();
                window.location.reload();
                return;
            }
            setErr(e?.message || "Failed to load players");
        }
    }

    useEffect(() => {
        load();
    }, []);

    function toggleSort(key: PlayerSortKey) {
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

    const sortIndicator = (key: PlayerSortKey) => {
        if (sortKey !== key || !sortDir) return "";
        return sortDir === "asc" ? " ^" : " v";
    };

    const sortedPlayers = useMemo(() => {
        if (!sortKey || !sortDir) return players;

        const sorted = [...players].sort((a, b) => {
            if (sortKey === "jersey_number") {
                return sortDir === "desc" ? b.jersey_number - a.jersey_number : a.jersey_number - b.jersey_number;
            }
            const aVal = a[sortKey].toString().toLowerCase();
            const bVal = b[sortKey].toString().toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortDir === "desc" ? -cmp : cmp;
        });

        return sorted;
    }, [players, sortKey, sortDir]);

    async function createPlayer() {
        setErr(null);
        const res = await apiFetch("/players/", {
            method: "POST",
            body: JSON.stringify({ name, jersey_number: jersey, position: pos }),
        });

        if (res.status === 403) {
            setErr("You are a viewer. Admin permission required to create players.");
            return;
        }
        if (!res.ok) {
            setErr("Create failed");
            return;
        }

        setName("");
        setJersey(0);
        setPos("");
        await load();
    }

    async function deletePlayer(playerId: number) {
        setErr(null);
        const res = await apiFetch(`/players/${playerId}`, {
            method: "DELETE",
        });

        if (res.status === 403) {
            setErr("You are a viewer. Admin status required to delete players.");
            return;
        }
        if(!res.ok) {
            setErr("Delete failed");
            return;
        }
        await load();
    }

    function startEdit(p: Player) {
        setEditId(p.id);
        setEditName(p.name);
        setEditJersey(String(p.jersey_number ?? ""));
        setEditPos(p.position ?? "");
    }

    function cancelEdit() {
        setEditId(null);
        setEditName("");
        setEditJersey("");
        setEditPos("");
    }

    async function saveEdit(playerId: number) {
        setErr(null);
        const payload = {
            name: editName,
            jersey_number: editJersey.trim() === "" ? null : Number(editJersey),
            position: editPos,
        };

        const res = await apiFetch(`/players/${playerId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        if (res.status === 403) {
            setErr("You are a viewer. Admin permission required to edit players.");
            return;
        }
        if (!res.ok) {
            const msg = await res.text();
            setErr(msg || "Update failed");
            return;
        }

        cancelEdit();
        await load();
    }

    return (
        <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Players</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

        {isAdmin && (
            <>
            <h3 style={{ marginTop: 24 }}>Add Player (admin)</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="number" value={jersey} onChange={(e) => setJersey(parseInt(e.target.value || "Number", 10))} />
                <input placeholder="Position" value={pos} onChange={(e) => setPos(e.target.value)} />
                <button onClick={createPlayer}>Create</button>
            </div>
            </>
        )}

            <h3>Roster</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th
                            style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "left", cursor: "pointer" }}
                            onClick={() => toggleSort("name")}
                        >
                            Name{sortIndicator("name")}
                        </th>
                        <th
                            style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center", cursor: "pointer" }}
                            onClick={() => toggleSort("jersey_number")}
                        >
                            Jersey #{sortIndicator("jersey_number")}
                        </th>
                        <th
                            style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center", cursor: "pointer" }}
                            onClick={() => toggleSort("position")}
                        >
                            Position{sortIndicator("position")}
                        </th>
                        {isAdmin && (
                            <th style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "center" }}>
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((p) => (
                        <tr key={p.id}>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                                {editId === p.id ? (
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                ) : (
                                    <Link to={`/players/${p.id}`}>{p.name}</Link>
                                )}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                {editId === p.id ? (
                                    <input
                                        type="number"
                                        value={editJersey}
                                        onChange={(e) => setEditJersey(e.target.value)}
                                        style={{ width: 80 }}
                                    />
                                ) : (
                                    p.jersey_number
                                )}
                            </td>
                            <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                {editId === p.id ? (
                                    <input value={editPos} onChange={(e) => setEditPos(e.target.value)} />
                                ) : (
                                    p.position
                                )}
                            </td>
                            {isAdmin && (
                                <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "center" }}>
                                    {editId === p.id ? (
                                        <>
                                            <button onClick={() => saveEdit(p.id)}>Save</button>
                                            <button style={{ marginLeft: 6 }} onClick={cancelEdit}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(p)}>Edit</button>
                                            <button style={{ marginLeft: 6 }} onClick={() => deletePlayer(p.id)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
