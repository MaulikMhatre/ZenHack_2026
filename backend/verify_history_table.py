from database import engine
from sqlalchemy import inspect, text

def check_db():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    if "surgery_history" in tables:
        print("Success: surgery_history table exists.")
        with engine.connect() as con:
            rs = con.execute(text("SELECT * FROM surgery_history"))
            print(f"Row count: {rs.rowcount}") # might be -1 for sqlite select
            rows = rs.fetchall()
            print(f"Rows: {len(rows)}")
    else:
        print("ERROR: surgery_history table MISSING.")

if __name__ == "__main__":
    check_db()
