from app.db.security import hash_password, verify_password


def _row_id(row):
    if row is None:
        return None
    if isinstance(row, dict):
        return row.get("id")
    return row[0]


def _row_field(row, field: str, index: int):
    if row is None:
        return None
    if isinstance(row, dict):
        return row.get(field)
    return row[index]

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
    return _row_id(row)

def get_user_by_username(conn, username: str):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return row
    return {
        "id": row[0],
        "username": row[1],
        "password_hash": row[2],
        "role": row[3],
        "created_at": row[4],
    }

def authenticate_user(conn, username: str, password: str):
    user = get_user_by_username(conn, username)
    if user is None:
        return None
    password_hash = _row_field(user, "password_hash", 2)
    if not verify_password(password, password_hash):
        return None
    return user
