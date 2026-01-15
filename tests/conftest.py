import sqlite3
import pytest
from app.db.schema import init_db

@pytest.fixture
def db_conn():
    """
    Creates a fresh in-memory SQL database for each test.
    """
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    init_db(conn)
    yield conn
    conn.close()