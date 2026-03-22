from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from billing_service import BillingService
from datetime import datetime

def reproduce_get_bill(admission_uid: str):
    db = SessionLocal()
    try:
        print(f"Checking {admission_uid}...")
        adm = db.query(models.Admission).filter(models.Admission.admission_uid == admission_uid).first()
        if not adm:
            print("Admission not found")
            return

        # Days
        days = BillingService.calculate_bed_days(adm.admission_time, datetime.utcnow())
        print(f"Days: {days}")
        
        bed = db.query(models.BedModel).filter(models.BedModel.id == adm.bed_id).first()
        bed_cat = bed.billing_category if bed else "Ward"
        print(f"Bed category: {bed_cat}")
        
        bed_price_item = db.query(models.PriceMaster).filter_by(name=bed_cat).first()
        bed_price = bed_price_item.price if bed_price_item else 3000.0
        print(f"Bed price: {bed_price}")
        
        bed_total = days * bed_price
        
        surgeries = db.query(models.SurgeryLog).filter_by(admission_uid=admission_uid).all()
        surg_total = sum(s.price_at_time for s in surgeries)
        print(f"Surgery total: {surg_total}")

        # Consumables
        consumables = db.query(models.InventoryLog).filter_by(admission_uid=admission_uid).all()
        cons_total = 0.0
        cons_tax = 0.0
        for log in consumables:
            inv_item_query = db.query(models.InventoryItem).filter(models.InventoryItem.id == log.item_id).first()
            if not inv_item_query: continue
            item_master = db.query(models.PriceMaster).filter(
                models.PriceMaster.category == "CONSUMABLE",
                models.PriceMaster.name == inv_item_query.name
            ).first()
            if item_master:
                price = item_master.price or 0.0
                tax_rate = item_master.gst_percent or 0.0
                qty = log.quantity_used or 0
                line_total = price * qty
                line_tax = line_total * (tax_rate / 100)
                cons_total += line_total
                cons_tax += line_tax
        
        grand_total = bed_total + surg_total + cons_total + cons_tax
        print(f"Grand total: {grand_total}")
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    uid = sys.argv[1] if len(sys.argv) > 1 else "ADM-20260215-1750"
    reproduce_get_bill(uid)
