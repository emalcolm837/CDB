from app.db.connect import get_connection
from app.db.schema import init_db
from app.services.user_service import create_user

def main():
    conn = get_connection()
    init_db(conn)
    user_id = create_user(conn, "coach", "changeme", "admin")
    conn.close()
    print("Created admin user:", user_id)

if __name__=='__main__':
    main()