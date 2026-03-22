from sqlalchemy import create_engine
import models

DATABASE_URL = "sqlite:///./hospital_os.db"

def init_tables():
    print("[INFO] Initializing Missing Tables...")
    try:
        engine = create_engine(DATABASE_URL)
        # create_all is idempotent; it won't touch existing tables but will create missing ones
        models.Base.metadata.create_all(bind=engine)
        print("[OK] All tables (Admissions, Bills, PriceMaster, etc.) should now exist.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize tables: {e}")

if __name__ == "__main__":
    init_tables()
