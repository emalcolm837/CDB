import getpass
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.db.connect import get_connection
from app.services.user_service import create_user


def main():
    username = input("Username: ").strip()
    if not username:
        print("Username is required.")
        sys.exit(1)

    role = input("Role (admin/player/recruiter/viewer) [viewer]: ").strip() or "viewer"
    password = getpass.getpass("Password: ")
    if not password:
        print("Password is required.")
        sys.exit(1)
    if "\x00" in password:
        print("Password contains a NULL byte (\\x00). Retype it manually.")
        print(f"Debug (repr): {password!r}")
        sys.exit(1)
    password = password.strip()

    conn = get_connection()
    try:
        user_id = create_user(conn, username, password, role)
    finally:
        conn.close()

    if user_id is None:
        print("User was not created.")
        sys.exit(1)

    print(f"Created user id={user_id} username={username} role={role}")


if __name__ == "__main__":
    main()
