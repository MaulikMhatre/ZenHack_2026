
from database import SessionLocal, engine, Base
import models 

def seed_beds():
    print("Initializing system infrastructure...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Beds (Physical Assets) if empty
        if db.query(models.BedModel).count() == 0:
            print("Seeding beds with Strict Distribution (190 Total)...")
            beds = []
            
            # ICU: 20 Beds
            for i in range(1, 21):
                beds.append(models.BedModel(id=f"ICU-{i}", type="ICU", is_occupied=False, status="AVAILABLE"))
            
            # ER: 60 Beds (Increased from 40)
            for i in range(1, 61):
                beds.append(models.BedModel(id=f"ER-{i}", type="ER", is_occupied=False, status="AVAILABLE"))

            # Surgery: 10 Beds (New)
            for i in range(1, 11):
                beds.append(models.BedModel(id=f"SURG-{i}", type="Surgery", current_state="AVAILABLE", status="AVAILABLE"))

            # Wards: 100 Beds (Gender Split)
            # Medical Ward (1-40): 1-20 Male, 21-40 Female
            for i in range(1, 21):
                beds.append(models.BedModel(id=f"Wards-{i}", type="Wards", is_occupied=False, status="AVAILABLE", gender="M"))
            for i in range(21, 41):
                beds.append(models.BedModel(id=f"Wards-{i}", type="Wards", is_occupied=False, status="AVAILABLE", gender="F"))
            
            # Specialty / Recovery / Security (41-100): Neutral
            for i in range(41, 101):
                 beds.append(models.BedModel(id=f"Wards-{i}", type="Wards", is_occupied=False, status="AVAILABLE", gender="Any"))
            
            db.add_all(beds)

        # 2. Seed Staff
        if db.query(models.Staff).count() == 0:
            print("Seeding staff...")
            staff_members = [
                models.Staff(id="N-01", name="Nurse Jackie", role="Nurse", hashed_password="password123", is_clocked_in=True),
                models.Staff(id="D-01", name="Dr. House", role="Doctor", hashed_password="password123", is_clocked_in=True)
            ]
            db.add_all(staff_members)

        db.commit()
        print("Infrastructure ready. 190 Beds Active.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_beds()
