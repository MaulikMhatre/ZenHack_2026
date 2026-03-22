from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Float, ForeignKey, Enum
from datetime import datetime
from database import Base
import enum

# Role-Based Access Control Enum
class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    DOCTOR = "Doctor"
    NURSE = "Nurse"


class BedModel(Base):
    __tablename__ = "beds"
    
    id = Column(String, primary_key=True, index=True) #  ICU-1
    type = Column(String)                             # ICU or ER
    billing_category = Column(String, default="Ward") # Ward, Semi-Private, Private, ICU, ICU_Ventilator
    is_occupied = Column(Boolean, default=False)
    status = Column(String, default="AVAILABLE")      # AVAILABLE, OCCUPIED, DIRTY, CLEANING
    
    # Patient details for your new ERP page
    patient_name = Column(String, nullable=True)
    patient_age = Column(Integer, nullable=True)
    condition = Column(String, nullable=True)
    surgeon_name = Column(String, nullable=True)
    
    # Snapshot of vitals at time of admission
    vitals_snapshot = Column(String, nullable=True) 
    admission_time = Column(DateTime, default=datetime.utcnow)
    ventilator_in_use = Column(Boolean, default=False)
    gender = Column(String, nullable=True) # M, F, or NULL (Any)

    # Surgery Unit Specific Fields
    current_state = Column(String, default="AVAILABLE") # AVAILABLE, OCCUPIED, OVERTIME, DIRTY, CLEANING
    expected_end_time = Column(DateTime, nullable=True)
    cleanup_start_time = Column(DateTime, nullable=True)
    next_surgery_start_time = Column(DateTime, nullable=True)
    admission_uid = Column(String, nullable=True) # [NEW] Track active admission 
    surgery_type = Column(String, nullable=True) # [NEW] Track active surgery type
    created_by_uid = Column(String, nullable=True) # [RBAC] Track staff who admitted patient

    def get_color_code(self):
        if self.status == "AVAILABLE": return "#32CD32" # Green
        if self.status == "OCCUPIED": return "#FF4500"  # Red-Orange
        if self.status == "DIRTY": return "#FFA500"     # Orange
        if self.status == "CLEANING": return "#87CEEB"  # Sky Blue
        return "#808080" # Grey (Unknown)
    


class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_predicted = Column(Integer)
    peak_value = Column(Integer)
    peak_time = Column(String)
    actual_weather_multiplier = Column(Float) 


class Ambulance(Base):
    __tablename__ = "ambulances"
    
    id = Column(String, primary_key=True, index=True) #  AMB-01
    status = Column(String, default="IDLE")           # IDLE, DISPATCHED, RETURNING, MAINTENANCE
    location = Column(String, default="Station")      # Current location description
    assigned_patient_id = Column(String, nullable=True)
    eta_minutes = Column(Integer, nullable=True)

class PatientRecord(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, index=True)
    esi_level = Column(Integer)
    acuity = Column(String)
    gender = Column(String, nullable=True) # M, F, or Other
    symptoms = Column(JSON)
    timestamp = Column(DateTime, default=datetime.now)
    bed_id = Column(String, ForeignKey("beds.id"), nullable=True)
    # New fields for history integration
    patient_name = Column(String, nullable=True)
    patient_age = Column(Integer, nullable=True)
    condition = Column(String, nullable=True)
    discharge_time = Column(DateTime, nullable=True)
    assigned_staff = Column(String, ForeignKey("staff.id"), nullable=True) # Added for Smart Nursing
    admission_uid = Column(String, nullable=True) # [NEW] Link to billing admission

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True) # "General", "ICU", "ER"
    total_nurses_on_shift = Column(Integer, default=0)
    total_doctors_on_shift = Column(Integer, default=0)

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(String, primary_key=True) # S-101
    name = Column(String)
    role = Column(String) # Will store "Admin", "Doctor", "Nurse" - matches UserRole enum values
    hashed_password = Column(String)
    is_clocked_in = Column(Boolean, default=False)
    department_id = Column(String, nullable=True)
    email = Column(String, nullable=True) # For future notifications/password reset 

class BedAssignment(Base):
    __tablename__ = "bed_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    bed_id = Column(String) # ForeignKey to beds.id
    staff_id = Column(String) # ForeignKey to staff.id
    assignment_type = Column(String) # "Primary Nurse", "Attending Physician"
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    bed_id = Column(String)
    patient_id = Column(String, ForeignKey("patients.id"))
    title = Column(String)
    assigned_to_staff_id = Column(String, nullable=True)
    description = Column(String)
    due_time = Column(DateTime)
    priority = Column(String) # "Low", "Medium", "High", "Critical"
    status = Column(String, default="Pending") # "Pending", "Completed"
    completed_at = Column(DateTime, nullable=True)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    event_type = Column(String) 
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True)

class PredictionLog(Base):
    __tablename__ = "prediction_log"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    prediction_text = Column(String) 
    target_department = Column(String) # ICU, ER
    predicted_delay_minutes = Column(Integer)










class SurgeryHistory(Base):
    __tablename__ = "surgery_history"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True)
    patient_name = Column(String)
    patient_age = Column(Integer, nullable=True)
    surgeon_name = Column(String, nullable=True)
    
    start_time = Column(DateTime)
    end_time = Column(DateTime, default=datetime.utcnow)
    
    total_duration_minutes = Column(Integer)
    overtime_minutes = Column(Integer, default=0)
    surgery_type = Column(String, nullable=True) # [NEW]
    admission_uid = Column(String, nullable=True) # [NEW]

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String) 
    quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=10)

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    admission_uid = Column(String, ForeignKey("admissions.admission_uid"), nullable=True) # [NEW] Link for billing
    patient_name = Column(String)
    bed_id = Column(String, nullable=True) # Matches BedModel.id
    quantity_used = Column(Integer)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class PatientQueue(Base):
    __tablename__ = "patient_queue"
    
    id = Column(String, primary_key=True, index=True)
    patient_name = Column(String)
    patient_age = Column(Integer)
    gender = Column(String)
    base_acuity = Column(Integer) # 1-5 (ESI)
    vitals = Column(JSON) # {hr, bp, spo2}
    symptoms = Column(JSON) # List of strings
    icd_code = Column(String, nullable=True)
    icd_rationale = Column(String, nullable=True)
    triage_urgency = Column(String, nullable=True)
    check_in_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="WAITING") # WAITING, CONSULTATION, COMPLETED
    priority_score = Column(Float, default=0.0)
class DoctorRoom(Base):
    __tablename__ = "doctor_rooms"
    
    id = Column(String, primary_key=True, index=True) # Room 1, Room 2
    doctor_name = Column(String)
    status = Column(String, default="IDLE") # IDLE, ACTIVE
    current_patient_id = Column(String, nullable=True)

# --- FINANCIAL MODULE MODELS ---

class PriceMaster(Base):
    __tablename__ = "price_master"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True) # "BED", "SURGERY", "CONSULTATION", "CONSUMABLE"
    name = Column(String, unique=True, index=True) # "ICU Bed", "Minor Surgery"
    price = Column(Float)
    gst_percent = Column(Float, default=0.0) # 0.0, 5.0, 12.0, 18.0
    description = Column(String, nullable=True)

class Admission(Base):
    __tablename__ = "admissions"
    
    admission_uid = Column(String, primary_key=True, index=True) # Unique Admission ID (e.g., ADM-2023-001)
    patient_id = Column(String, ForeignKey("patients.id")) 
    bed_id = Column(String, ForeignKey("beds.id"))
    
    admission_time = Column(DateTime, default=datetime.utcnow)
    discharge_time = Column(DateTime, nullable=True)
    
    status = Column(String, default="ACTIVE") # ACTIVE, DISCHARGED, SETTLED
    total_amount = Column(Float, default=0.0)
    
    # Snapshot of patient details at admission for immutable record
    patient_name = Column(String)
    patient_age = Column(Integer)
    created_by_uid = Column(String, nullable=True) # [RBAC] Track staff who created admission
    
class SurgeryLog(Base):
    __tablename__ = "surgery_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admission_uid = Column(String, ForeignKey("admissions.admission_uid"))
    surgery_name = Column(String) # Linked to PriceMaster.name logically
    price_at_time = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
    created_by_uid = Column(String, nullable=True) # [RBAC] Track staff who logged surgery

class Bill(Base):
    __tablename__ = "bills"
    
    bill_no = Column(String, primary_key=True, index=True) # BILL-YYYY-XXXX
    admission_uid = Column(String, ForeignKey("admissions.admission_uid"))
    
    total_amount = Column(Float)
    tax_amount = Column(Float)
    grand_total = Column(Float)
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    is_paid = Column(Boolean, default=False)
    payment_mode = Column(String, nullable=True)

class BillItem(Base):
    __tablename__ = "bill_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String, ForeignKey("bills.bill_no"))
    
    description = Column(String) # "ICU Bed Charge (3 Days)", "Appendectomy"
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float)
    total_price = Column(Float) # qty * unit_price
    tax_percent = Column(Float)
    tax_amount = Column(Float)

class ConsultationLog(Base):
    __tablename__ = "consultation_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, index=True)
    patient_name = Column(String)
    doctor_name = Column(String, nullable=True)
    room_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    price_at_time = Column(Float)
    bill_no = Column(String, nullable=True) # Linked once billed

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    staff_id = Column(String, index=True)
    staff_role = Column(String)
    action = Column(String, index=True) # e.g., 'LOGIN', 'LOGOUT', 'DATA_VIEW'
    resource_path = Column(String)
    details = Column(String, nullable=True) # clinical context or other info
    ip_address = Column(String)
