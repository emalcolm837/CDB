import { Routes, Route, Navigate, Link } from "react-router-dom"
import { getToken, clearToken, getUsername, getRole } from "./api";

import Login from "./pages/Login";
import Players from "./pages/Players";
import Games from "./pages/Games";
import Stats from "./pages/Stats";
import BoxScore from "./pages/BoxScore";
import PlayerPage from "./pages/PlayerPage";
import Analytics from "./pages/Analytics";

export default function App() {
  const token = getToken();
  const username = getUsername();
  const role = getRole();

  if (!token) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <div style={{ fontFamily: "system-ui" }}>
      {/* NAV BAR */}
      <nav style={{ padding: 12, borderBottom: "1px solid #ccc" }}>
        <strong style={{ marginRight: 16 }}>CDB</strong>

        <Link to="/players" style={{ marginRight: 12}}>
          Roster
        </Link>

        <Link to="/stats" style={{ marginRight: 12 }}>
          Stats
        </Link>

        <Link to="/games" style={{ marginRight: 12 }}>
          Games
        </Link>

        <Link to="/analytics" style={{ marginRight: 12 }}>
          Analytics
        </Link>

        <span style={{ marginLeft: 24 }}>
          Logged in as <strong>{username}</strong> ({role})
        </span>

        <button
          style={{ marginLeft: 16 }}
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
        >
          Logout
        </button>
      </nav>

      {/* ROUTES */}
      <Routes>
        <Route path="/" element={<Navigate to="/players" />} />
        <Route path="/players" element={<Players />} />
        <Route path="/games" element={<Games />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/games/:gameId" element={<BoxScore />} />
        <Route path="/players/:playerId" element={<PlayerPage />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/players" />} />
      </Routes>
    </div>
  );
}