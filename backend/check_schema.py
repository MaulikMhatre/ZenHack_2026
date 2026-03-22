from sqlalchemy import create_engine, inspect
import os

DB_URL = "sqlite:///./hospital_os.db"
engine = create_engine(DB_URL)

inspector = inspect(engine)
columns = inspector.get_columns('surgery_history')

found = False
for col in columns:
    if col['name'] == 'patient_age':
        found = True
        break

if found:
    print("MATCH: Column 'patient_age' exists in 'surgery_history'.")
else:
    print("MISSING: Column 'patient_age' NOT found in 'surgery_history'.")
