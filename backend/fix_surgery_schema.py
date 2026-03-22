import sqlite3

def run_migration():
    conn = sqlite3.connect('c:/Phrelis_ERP/backend/hospital_os.db')
    cursor = conn.cursor()
    
    print("Running migrations...")
    
    # 1. Update 'beds' table
    try:
        cursor.execute("ALTER TABLE beds ADD COLUMN admission_uid VARCHAR")
        print("Added admission_uid to beds")
    except sqlite3.OperationalError as e:
        print(f"Skipping beds.admission_uid: {e}")

    try:
        cursor.execute("ALTER TABLE beds ADD COLUMN surgery_type VARCHAR")
        print("Added surgery_type to beds")
    except sqlite3.OperationalError as e:
        print(f"Skipping beds.surgery_type: {e}")

    # 2. Update 'surgery_history' table
    try:
        cursor.execute("ALTER TABLE surgery_history ADD COLUMN surgery_type VARCHAR")
        print("Added surgery_type to surgery_history")
    except sqlite3.OperationalError as e:
        print(f"Skipping surgery_history.surgery_type: {e}")

    try:
        cursor.execute("ALTER TABLE surgery_history ADD COLUMN admission_uid VARCHAR")
        print("Added admission_uid to surgery_history")
    except sqlite3.OperationalError as e:
        print(f"Skipping surgery_history.admission_uid: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
