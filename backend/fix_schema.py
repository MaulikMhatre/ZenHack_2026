import sqlite3

def fix_schema():
    conn = sqlite3.connect('hospital_os.db')
    cursor = conn.cursor()
    try:
        print("Attempting to add billing_category column to beds table...")
        cursor.execute("ALTER TABLE beds ADD COLUMN billing_category VARCHAR DEFAULT 'Ward'")
        conn.commit()
        print("Success: Column added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
