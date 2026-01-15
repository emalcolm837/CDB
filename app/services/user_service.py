from app.db.security import hash_password, verify_password

def create_user(conn, username: str, password: str, role: str) -> int:
    cursor = conn.cursor()
    password_hash = hash_password(password)
    cursor.execute(
        """
        INSERT INTO users (username, password_hash, role)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (username, password_hash, role),
    )
    conn.commit()
    row = cursor.fetchone()
    return row["id"] if row else None

def get_user_by_username(conn, username: str):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    return cursor.fetchone()

def authenticate_user(conn, username: str, password: str):
    user = get_user_by_username(conn, username)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user
