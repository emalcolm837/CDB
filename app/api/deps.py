from typing import Generator
from app.db.connect import get_connection

def get_db() -> Generator:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()