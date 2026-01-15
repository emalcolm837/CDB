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

def test_admin_can_create_player_viewer_cannot(client):
    c, conn = client

    create_user(conn, "admin1", "adminpass", "admin")
    create_user(conn, "viewer1", "viewerpass", "viewer")

    admin_token = login(c, "admin1", "adminpass")
    viewer_token = login(c, "viewer1", "viewerpass")

    r_view = c.post(
        "/players/",
        json={"name": "Nope", "jersey_number": 9, "position": "G"},
        headers=auth_headers(viewer_token),
    )
    assert r_view.status_code == 403, r_view.text

    r_admin = c.post(
        "/players/",
        json={"name": "Yep", "jersey_number": 0, "position": "PG"},
        headers=auth_headers(admin_token),
    )
    assert r_admin.status_code == 200, r_admin.text

def test_unauthenticated_requests_get_401(client):
    c, conn = client

    r = c.get("/players/")
    assert r.status_code == 401, r.text