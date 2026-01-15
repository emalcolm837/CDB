import os
import psycopg

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """
    Returns a connection to the Postgres database.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    conn = psycopg.connect(DATABASE_URL)
    return conn
