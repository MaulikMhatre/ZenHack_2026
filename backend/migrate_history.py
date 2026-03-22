from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating Database - Adding Surgery History...")
        try:
            # Create surgery_history table
            # We'll use raw SQL for simplicity in this script, or better yet, rely on SQLAlchemy to generate it if we could, 
            # but since we are patching an existing DB without Alembic, we'll CREATE TABLE IF NOT EXISTS.
            
            sql = """
            CREATE TABLE IF NOT EXISTS surgery_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id VARCHAR,
                patient_name VARCHAR,
                patient_age INTEGER,
                surgeon_name VARCHAR,
                start_time DATETIME,
                end_time DATETIME,
                total_duration_minutes INTEGER,
                overtime_minutes INTEGER
            );
            """
            conn.execute(text(sql))
            print("Executed: CREATE TABLE surgery_history")
                    
            conn.commit()
            print("Migration Complete.")
            
        except Exception as e:
            print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate()
