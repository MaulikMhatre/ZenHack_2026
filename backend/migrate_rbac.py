"""
Migration script to add RBAC fields to existing database
Adds created_by_uid columns for accountability tracking
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "hospital_os.db"

def migrate_database():
    """Add RBAC tracking fields to existing tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting RBAC migration...")
    
    try:
        # Add created_by_uid to beds table
        try:
            cursor.execute("ALTER TABLE beds ADD COLUMN created_by_uid TEXT")
            print("✅ Added created_by_uid to beds table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  created_by_uid already exists in beds table")
            else:
                raise
        
        # Add created_by_uid to admissions table
        try:
            cursor.execute("ALTER TABLE admissions ADD COLUMN created_by_uid TEXT")
            print("✅ Added created_by_uid to admissions table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  created_by_uid already exists in admissions table")
            else:
                raise
        
        # Add created_by_uid to surgery_logs table
        try:
            cursor.execute("ALTER TABLE surgery_logs ADD COLUMN created_by_uid TEXT")
            print("✅ Added created_by_uid to surgery_logs table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  created_by_uid already exists in surgery_logs table")
            else:
                raise
        
        # Add email to staff table
        try:
            cursor.execute("ALTER TABLE staff ADD COLUMN email TEXT")
            print("✅ Added email to staff table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("⏭️  email already exists in staff table")
            else:
                raise
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
