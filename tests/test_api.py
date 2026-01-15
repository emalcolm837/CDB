import sqlite3
import pytest
from fastapi.testclient import TestClient

from app.api.app import app
from app.api.deps import get_db
from app.db.schema import init_db
from app.services.user_service import create_user

@pytest.fixture()
def client():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    init_db(conn)

    def override_get_db():
        yield conn

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c, conn

    app.dependency_overrides.clear()
    conn.close()

def login(client: TestClient, username: str, password: str) -> str:
    r = client.post(
        "/auth/token",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

def admin_token(client: TestClient, conn: sqlite3.Connection) -> str:
    create_user(conn, "admin1", "adminpass", "admin")
    return login(client, "admin1", "adminpass")

def test_players_create_and_list(client):
    c, conn = client
    headers = auth_headers(admin_token(c, conn))

    r = c.post("/players/", json={
        "name": "Alex",
        "jersey_number": 0,
        "position": "PG"
    }, headers=headers)
    assert r.status_code == 200
    pid = r.json()["player_id"]
    assert isinstance(pid, int)

    r = c.get("/players/", headers=headers)
    assert r.status_code == 200
    players = r.json()
    assert len(players) == 1
    assert players[0]["name"] == "Alex"

def test_games_unique(client):
    c, conn = client
    headers = auth_headers(admin_token(c, conn))

    r1 = c.post("/games/", json={
        "date": "2026-01-06",
        "opponent": "Central High",
        "location": "Home"
    }, headers=headers)
    assert r1.status_code == 200

    r2 = c.post("/games/", json={
        "date": "2026-01-06",
        "opponent": "Central High",
        "location": "Home"
    }, headers=headers)
    assert r2.status_code in (409, 400)

def test_statline_flow_create_get_delete(client):
    c, conn = client
    headers = auth_headers(admin_token(c, conn))

    pid = c.post(
        "/players/",
        json={"name": "P1", "jersey_number": 1, "position": "G"},
        headers=headers,
    ).json()["player_id"]
    gid = c.post(
        "/games/",
        json={"date": "2026-01-06", "opponent": "Opp", "location": "Away"},
        headers=headers,
    ).json()["game_id"]

    s = c.post("/stat-lines/", json={
        "player_id": pid,
        "game_id": gid,
        "points": 18,
        "rebounds": 5, 
        "assists": 7, 
        "turnovers": 2
    }, headers=headers)
    assert s.status_code == 200

    g = c.get(f"/stat-lines/by-player/{pid}/by-game/{gid}", headers=headers)
    assert g.status_code == 200
    assert g.json()["points"] == 18

    d = c.delete(f"/stat-lines/by-player/{pid}/by-game/{gid}", headers=headers)
    assert d.status_code == 200
    assert d.json()["deleted"] is True 

    g2 = c.get(f"/stat-lines/by-player/{pid}/by-game/{gid}", headers=headers)
    assert g2.status_code == 404
