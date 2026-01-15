import sqlite3
import os

# Path to the SQLite database file

#BASE_DIR becomes project root folder
# BASE_DIR = Path(__file__).resolve().parent.parent.parent 

#DB_PATH creates path from root to cdb.sqlite
DB_PATH = os.getenv("CDB_DB_PATH", "cdb.sqlite3")

def get_connection():
    """
    Returns a connection to the SQLite database.
    Creates the database file if it does not exist.
    """
    # FastAPI may execute request handlers in different threads than where the connection is created.
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
