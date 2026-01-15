import { useState } from "react";
import { setToken, setUserInfo } from "../api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const body = new URLSearchParams();
        body.set("username", username);
        body.set("password", password);

        const res = await fetch(`${BASE_URL}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        });

        if (!res.ok) {
            setErr("Login failed");
            return;
        }

        const data = await res.json();
        setToken(data.access_token);

        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
            const me = await meRes.json();
            setUserInfo(me.username, me.role);
        } else {
            setUserInfo("unknown", "viewer");
        }

        onLogin();
    }

    return (
        <div style={{ maxWidth: 360, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                    <label>Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
                </div>
                <button type="submit">Sign in</button>
            </form>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
        </div>
    );
}
