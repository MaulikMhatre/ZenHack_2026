from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import models
import uuid

class BillingService:
    
    @staticmethod
    def get_price(db: Session, item_name: str) -> float:
        """Fetch price from PriceMaster."""
        item = db.query(models.PriceMaster).filter(models.PriceMaster.name == item_name).first()
        return item.price if item else 0.0

    @staticmethod
    def calculate_bed_days(admission_time: datetime, discharge_time: datetime) -> int:
        """
        Calculate bed days based on 'Calendar Day' rule.
        Rule: Any stay after 11:00 AM is charged as a new day.
        """
        # Normalize to local time or stick to UTC? adherence to 11:00 AM implies a specific timezone.
        # Assuming times are stored in UTC, we need to convert to IST (UTC+5:30) for the 11 AM check?
        # OR just follow the logic: 
        # Day 1: Admission
        # Day N: Discharge.
        # If Discharge Time > 11:00 AM, Charge for that day too.
        
        # Simple Logic:
        # Count midnights passed? 
        # Standard Hotel/Hospital rule:
        # Check-in: Day 1 starts.
        # Check-out before 11 AM: Don't charge for the checkout day (unless it's the same day).
        # Check-out after 11 AM: Charge for the checkout day.
        
        # Let's work with datetime objects.
        # We need to simulate the 11 AM cutoff.
        
        if not discharge_time:
            discharge_time = datetime.utcnow() # ongoing
            
        # Convert to a comparable value (e.g. total hours) or just iterate days?
        # Let's use a simpler approach:
        # Calculate standard 24h blocks? No, prompt says 'Calendar Day' rule.
        
        # Example:
        # Admitted Jan 1st 2 PM.
        # Discharged Jan 2nd 10 AM. -> 1 Day (Jan 1st).
        # Discharged Jan 2nd 12 PM. -> 2 Days (Jan 1st + Jan 2nd).
        
        # Logic:
        # Create a set of "Billable Dates".
        # Date of Admission is always billable.
        # Date of Discharge is billable IF time > 11:00 AM.
        # Any dates in between are billable.
        
        # Note: All dates/times in DB are UTC. 11:00 AM IST is 05:30 AM UTC.
        # We need to be careful with Timezones. 
        # Prompt says "Hospital Project", implies India (GST, Rupees).
        # IST is UTC+5:30.
        # 11:00 AM IST = 05:30 AM UTC.
        
        cutoff_hour_utc = 5 
        cutoff_minute_utc = 30
        
        start_date = admission_time.date()
        end_date = discharge_time.date()
        
        days_charged = 0
        
        # Iterate through all dates from start to end (inclusive)
        current_date = start_date
        while current_date <= end_date:
            is_billable = False
            
            if current_date == start_date:
                is_billable = True
            elif current_date == end_date:
                # Check cutoff
                # discharge_time (datetime) vs 05:30 AM on end_date
                cutoff_time = datetime(end_date.year, end_date.month, end_date.day, cutoff_hour_utc, cutoff_minute_utc)
                if discharge_time.time() > cutoff_time.time(): # This comparison is tricky with just .time() if dates differ?
                    # No, we are on the specific 'end_date'
                    # Actually, just comparing discharge_time (datetime) > cutoff_datetime
                     if discharge_time > cutoff_time:
                         is_billable = True
            else:
                is_billable = True # Full days in between
            
            if is_billable:
                days_charged += 1
            
            current_date += timedelta(days=1)
            
        return max(1, days_charged) # Minimum 1 day

    @staticmethod
    def generate_bill(db: Session, admission_uid: str) -> models.Bill:
        """
        Generate a detailed bill for the given admission.
        """
        admission = db.query(models.Admission).filter(models.Admission.admission_uid == admission_uid).first()
        if not admission:
            return None
            
        # 1. Calculate Bed Charges
        # Get Bed Category Price
        # We need the bed model. But Admission only has bed_id. 
        # We might need to fetch the bed OR store the category in Admission at start? 
        # Storing at start is safer for rate locking, but let's fetch current bed for now.
        bed = db.query(models.BedModel).filter(models.BedModel.id == admission.bed_id).first()
        bed_category = bed.billing_category if bed else "Ward"
        
        bed_rate_item = db.query(models.PriceMaster).filter(
            models.PriceMaster.category == "BED", 
            models.PriceMaster.name == bed_category # e.g., "ICU"
        ).first()
        
        # Fallback if specific category rate not found
        if not bed_rate_item:
             # Try generic match or default
             bed_price = 3000.0 # Default Ward
             bed_gst = 0.0
        else:
             bed_price = bed_rate_item.price
             bed_gst = bed_rate_item.gst_percent
             
        # Calculate Days
        discharge_dt = admission.discharge_time or datetime.utcnow()
        days = BillingService.calculate_bed_days(admission.admission_time, discharge_dt)
        
        bed_total = days * bed_price
        bed_tax = bed_total * (bed_gst / 100)
        
        # 2. Get Surgery Charges
        surgery_logs = db.query(models.SurgeryLog).filter(models.SurgeryLog.admission_uid == admission_uid).all()
        surgery_total = 0.0
        surgery_tax = 0.0
        
        bill_items = []
        
        # Add Bed Item
        bill_items.append({
            "description": f"Bed Charges ({bed_category} - {admission.bed_id}) - {days} Days",
            "quantity": days,
            "unit_price": bed_price,
            "total_price": bed_total,
            "tax_percent": bed_gst,
            "tax_amount": bed_tax
        })
        
        # Add Surgery Items
        for surgery in surgery_logs:
            # Re-fetch gst from PriceMaster just to be sure, or assume 0 based on prompt
            # Prompt says: "0% on Doctor/Bed fees (Healthcare Services)" -> Surgery is a service.
            pm = db.query(models.PriceMaster).filter(models.PriceMaster.name == surgery.surgery_name).first()
            s_gst = pm.gst_percent if pm else 0.0
            
            s_price = surgery.price_at_time
            s_tax_amt = s_price * (s_gst / 100)
            
            surgery_total += s_price
            surgery_tax += s_tax_amt
            
            bill_items.append({
                "description": f"Surgery - {surgery.surgery_name}",
                "quantity": 1,
                "unit_price": s_price,
                "total_price": s_price,
                "tax_percent": s_gst,
                "tax_amount": s_tax_amt
            })

        # 3. Get Consumable Charges
        consumable_logs = db.query(models.InventoryLog).filter(models.InventoryLog.admission_uid == admission_uid).all()
        consumable_total = 0.0
        consumable_tax = 0.0
        
        for log in consumable_logs:
            # Defensive check for item existence
            inv_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == log.item_id).first()
            if not inv_item:
                continue
                
            # Join with PriceMaster to get price by item name
            item_master = db.query(models.PriceMaster).filter(
                models.PriceMaster.category == "CONSUMABLE",
                models.PriceMaster.name == inv_item.name
            ).first()
            
            if item_master:
                c_price = item_master.price or 0.0
                c_gst = item_master.gst_percent or 0.0
                c_qty = log.quantity_used or 0
                c_line_total = c_price * c_qty
                c_line_tax = c_line_total * (c_gst / 100)
                
                consumable_total += c_line_total
                consumable_tax += c_line_tax
                
                bill_items.append({
                    "description": f"Resource - {item_master.name}",
                    "quantity": c_qty,
                    "unit_price": c_price,
                    "total_price": c_line_total,
                    "tax_percent": c_gst,
                    "tax_amount": c_line_tax
                })

        # 4. Get Consultation Charges
        # Fetch unbilled consultations for this patient
        consult_logs = db.query(models.ConsultationLog).filter(
            models.ConsultationLog.patient_id == admission.patient_id,
            models.ConsultationLog.bill_no == None
        ).all()
        consult_total = 0.0
        consult_tax = 0.0 # Standardized 0% for consults per previous logic, but let's check PriceMaster
        
        for consult in consult_logs:
            c_price = consult.price_at_time or 0.0
            consult_total += c_price
            # consult_tax += 0.0
            
            bill_items.append({
                "description": f"Consultation - {consult.doctor_name} ({consult.room_id})",
                "quantity": 1,
                "unit_price": c_price,
                "total_price": c_price,
                "tax_percent": 0.0,
                "tax_amount": 0.0
            })

        # 5. Create Bill Record
        grand_total = (bed_total + bed_tax) + (surgery_total + surgery_tax) + (consumable_total + consumable_tax) + consult_total
        total_tax = bed_tax + surgery_tax + consumable_tax
        pre_tax_total = bed_total + surgery_total + consumable_total + consult_total
        
        bill_no = f"BILL-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
        
        new_bill = models.Bill(
            bill_no=bill_no,
            admission_uid=admission_uid,
            total_amount=pre_tax_total,
            tax_amount=total_tax,
            grand_total=grand_total,
            is_paid=False
        )
        
        db.add(new_bill)
        db.flush() # Generate ID if needed, though we set bill_no manually
        
        # Add Items to DB
        for item in bill_items:
            db_item = models.BillItem(
                bill_no=bill_no,
                description=item["description"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=item["total_price"],
                tax_percent=item["tax_percent"],
                tax_amount=item["tax_amount"]
            )
            db.add(db_item)
            
        db.commit()
        return new_bill

