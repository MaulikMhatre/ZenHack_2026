from database import engine
from sqlalchemy import inspect

def check_patients_schema():
    inspector = inspect(engine)
    columns = inspector.get_columns('patients')
    print("Columns in 'patients' table:")
    for col in columns:
        print(f"- {col['name']} ({col['type']})")

if __name__ == "__main__":
    check_patients_schema()
