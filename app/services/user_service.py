from app.db.security import hash_password, verify_password

def create_user(conn, username: str, password: str, role: str) -> int:
    cursor = conn.cursor()
    password_hash = hash_password(password)
    cursor.execute(
        """
        INSERT INTO users (username, password_hash, role)
        VALUES (?, ?, ?)
        """,
        (username, password_hash, role),
    )
    conn.commit()
    return cursor.lastrowid

def get_user_by_username(conn, username: str):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    return cursor.fetchone()

def authenticate_user(conn, username: str, password: str):
    user = get_user_by_username(conn, username)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user