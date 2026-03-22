from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models # Assumes models.py is in the same dir or path

DATABASE_URL = "sqlite:///./hospital_os.db" # Corrected path

def check_db():
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        admissions = db.query(models.Admission).all()
        print(f"[INFO] Total Admissions in DB: {len(admissions)}")
        for adm in admissions:
            print(f" - UID: {adm.admission_uid}, Patient: {adm.patient_name}, Status: {adm.status}")
            
        bill_items = db.query(models.BillItem).all()
        print(f"[INFO] Total Bill Items: {len(bill_items)}")
        for item in bill_items:
            print(f" - Bill: {item.bill_no}, Desc: {item.description}, Price: {item.total_price}")
            
        db.close()
    except Exception as e:
        print(f"[ERROR] DB Check Failed: {e}")

if __name__ == "__main__":
    check_db()
