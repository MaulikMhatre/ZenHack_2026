
import sqlite3
import os

# Path to your database
DB_PATH = 'hospital_os.db'

def simulate_capacity(full=True):
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if full:
        print("Simulating 100% Capacity...")
        # Mark all beds as occupied
        cursor.execute("UPDATE beds SET is_occupied = 1, status = 'OCCUPIED'")
    else:
        print("Restoring Capacity...")
        # Mark all beds as available
        cursor.execute("UPDATE beds SET is_occupied = 0, status = 'AVAILABLE', patient_name = NULL")

    conn.commit()
    conn.close()
    print("Database updated. Check the dashboard now!")

if __name__ == "__main__":
    import sys
    is_full = '--reset' not in sys.argv
    simulate_capacity(full=is_full)
