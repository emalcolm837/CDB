from app.db.connect import get_connection
from app.db.migrations import migrate_games_add_unique, migrate_stat_line_add_shooting_columns, migrate_stat_line_minutes_to_numeric

def main():
    conn = get_connection()
    migrate_games_add_unique(conn)
    migrate_stat_line_add_shooting_columns(conn)
    migrate_stat_line_minutes_to_numeric(conn)
    conn.close()
    print("Migration complete: games unique + stat_line shooting columns")

if __name__ == "__main__":
    main()
