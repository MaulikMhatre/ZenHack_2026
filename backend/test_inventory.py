from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, InventoryItem, InventoryLog, BedModel
from inventory_service import InventoryService
from database import SQLALCHEMY_DATABASE_URL
import asyncio

# Setup Test DB Connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class MockManager:
    async def broadcast(self, msg):
        print(f"[MOCK WS] Broadcasting: {msg}")

async def test_inventory_flow():
    db = TestingSessionLocal()
    manager = MockManager()
    
    print("--- 1. Initial State ---")
    vent_item = db.query(InventoryItem).filter_by(name="Ventilator Circuit").first()
    if not vent_item:
        print("ERROR: Database not seeded correctly.")
        return
        
    print(f"Ventilator Circuit: {vent_item.quantity}")
    initial_qty = vent_item.quantity

    print("\n--- 2. Simulating ICU Admission (Infectious) ---")
    # Simulate Logic from main.py admit_patient
    context = "ICU"
    patient_data = {"patient_name": "Test Patient", "bed_id": "ICU-TEST", "condition": "Severe Pneumonia (Infectious)"}
    
    await InventoryService.process_usage(db, manager, context, patient_data)
    
    # Check Deduction
    db.refresh(vent_item)
    print(f"Ventilator Circuit after Admission: {vent_item.quantity}")
    
    # Expected: -1 Vent, -1 Sedation, -1 PPE (Infectious)
    assert vent_item.quantity == initial_qty - 1, f"Expected {initial_qty - 1}, got {vent_item.quantity}"
    
    ppe_item = db.query(InventoryItem).filter_by(name="PPE Kit").first()
    print(f"PPE Kit used: {ppe_item.quantity}")

    print("\n--- 3. Simulating Surgery Start ---")
    context = "Surgery"
    patient_data = {"patient_name": "Surgery Patient", "bed_id": "OR-1", "condition": "Surgery Start"}
    await InventoryService.process_usage(db, manager, context, patient_data)
    
    gown_item = db.query(InventoryItem).filter_by(name="Sterile Gowns").first()
    print(f"Sterile Gowns after Surgery Start: {gown_item.quantity}") # Should decrease by 2

    print("\n--- 4. Checking Low Stock Alert ---")
    # Force low stock
    or_prep = db.query(InventoryItem).filter_by(name="OR Prep Kit").first()
    original_prep_qty = or_prep.quantity
    or_prep.quantity = 4 # Reorder is 3
    db.commit()
    
    # Use 2 more
    inv_item, is_low = InventoryService.deduct_stock(db, "OR Prep Kit", 2)
    db.refresh(or_prep)
    print(f"OR Prep Kit: {or_prep.quantity} (Reorder: {or_prep.reorder_level})")
    
    if or_prep.quantity < or_prep.reorder_level:
        print("SUCCESS: Low Stock Threshold Breached")
    else:
        print("FAILURE: Low Stock Threshold IGNORED")
    
    # Clean up (Restore logic if needed, or just leave it)
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_inventory_flow())
