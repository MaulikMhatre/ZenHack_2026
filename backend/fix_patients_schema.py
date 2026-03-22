import sqlite3

def run_migration():
    conn = sqlite3.connect('c:/Phrelis_ERP/backend/hospital_os.db')
    cursor = conn.cursor()
    
    print("Running migration for patients table...")
    
    try:
        cursor.execute("ALTER TABLE patients ADD COLUMN admission_uid VARCHAR")
        print("Added admission_uid to patients")
    except sqlite3.OperationalError as e:
        print(f"Skipping patients.admission_uid: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
