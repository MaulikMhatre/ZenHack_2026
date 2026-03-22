
from database import engine
import models  # This must be imported to register your classes

def migrate():
    print("Synchronizing Database Schema...")
    try:
        # This command creates all tables defined in models.py 
        # (hospital_beds, surgery_history, etc.) with all their current columns.
        models.Base.metadata.create_all(bind=engine)
        print("Success: All tables and columns are now synchronized.")
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate()