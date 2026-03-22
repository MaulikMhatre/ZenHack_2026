import simple_icd_10 as icd
import uvicorn
import math
import uuid
import os
from dotenv import load_dotenv
import pickle
import pandas as pd
import httpx
import asyncio
import numpy as np
from pydantic import BaseModel

from datetime import timedelta
from datetime import datetime
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy import func

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect,File, Depends,UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from passlib.context import CryptContext
from jose import jwt


from database import engine, get_db
from database import engine, get_db
import models
from inventory_service import InventoryService 
from billing_service import BillingService # [NEW]
from sqlalchemy import desc 
from auth_middleware import get_current_user, require_role, require_admin, require_admin_or_doctor, require_any_staff, CurrentUser, log_audit_event # [RBAC] 
from fastapi import Request

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import torchxrayvision as xrv
import torch
import skimage.io
import io
import torchvision.transforms as transforms


from xhtml2pdf import pisa
from jinja2 import Template
import io
from datetime import datetime

try:
    with open("inflow_model.pkl", "rb") as f:
        ai_brain = pickle.load(f)
    print("🧠 AI Inflow Model Loaded Successfully")
except Exception as e:
    ai_brain = None
    print(f"⚠️ AI Model failed to load: {e}")
load_dotenv()
class RadiologySentinel:
    def __init__(self, model_path="radiology_model.pkl"):
        try:
            # Option A: The Secure Way (Adding to Allowlist)
            # This tells PyTorch it's safe to unpickle the DenseNet class
            torch.serialization.add_safe_globals([xrv.models.DenseNet])
            self.model = torch.load(model_path, map_location=torch.device('cpu'), weights_only=False)
            
            # Option B: The "Trust me, I made this" Way
            # If Option A still gives you trouble, use this:
            # self.model = torch.load(model_path, map_location=torch.device('cpu'), weights_only=False)

            self.model.eval()
            self.active = True
            print("🩻 Radiology Sentinel Loaded Successfully")
        except Exception as e:
            print(f"❌ Failed to load Radiology model: {e}")
            self.active = False

    async def analyze(self, image_bytes: bytes):
        """
        Phrelis Radiology Sentinel: Computer Vision Pipeline
        Converts raw bytes to a normalized tensor, runs DenseNet inference, 
        and maps results to clinical pathologies.
        """

        try:
            # 1. Decode bytes into a numpy array (supports JPG, PNG, etc.)
            img = skimage.io.imread(io.BytesIO(image_bytes))
            
            # 2. Medical Normalization: TorchXRayVision expects [-1024, 1024]
            # Standard images are [0, 255]. This utility handles the conversion.
            img = xrv.datasets.normalize(img, 255) 

            # 3. Shape Handling: Ensure we are working with a 2D grayscale map
            if len(img.shape) > 2:
                # If RGB, take the first channel (standard for X-ray processing)
                img = img[:, :, 0]
            
            # Add the required channel dimension [Channel, Height, Width]
            img = img[None, :, :] 

            # 4. Clinical Pre-processing
            # XRV DenseNet requires exactly 224x224 pixels with a center crop
            transform = transforms.Compose([
                xrv.datasets.XRayCenterCrop(),
                xrv.datasets.XRayResizer(224)
            ])
            
            img = transform(img)
            # Convert to Torch Tensor and add Batch dimension [Batch, Channel, H, W]
            img = torch.from_numpy(img).unsqueeze(0) 

            # 5. Non-Gradient Inference (Saves memory and speed)
            with torch.no_grad():
                preds = self.model(img)
                
                # 6. Result Mapping
                # Zip the model's pathology labels with the output scores
                raw_results = dict(zip(self.model.pathologies, preds[0].detach().numpy().tolist()))
                
                # Clean the results: Round to 4 decimal places for the API response
                clinical_findings = {k: round(float(v), 4) for k, v in raw_results.items()}
                
            return clinical_findings

        except Exception as e:
            print(f"☢️ Radiology Pipeline Error: {e}")
            return {"error": "Processing Failed", "details": str(e)}

# Initialize
radiology_ai = RadiologySentinel()

models.Base.metadata.create_all(bind=engine)

def seed_price_master():
    db = next(get_db())
    # Format: (Category, Name, Price, GST%, Description)
    items = [
        # BED RATES
        ("BED", "Ward", 3000.0, 0.0, "General Ward Bed"),
        ("BED", "Semi-Private", 6000.0, 0.0, "Semi-Private Room"),
        ("BED", "Private", 10000.0, 0.0, "Private Room"),
        ("BED", "ICU", 20000.0, 0.0, "ICU Bed"),
        ("BED", "ICU_Ventilator", 35000.0, 0.0, "ICU Bed with Ventilator"),
        
        # SURGERY RATES (Services = 0% GST usually, but check prompt. Prompt says "Legal Tax Engine... 0% on Doctor/Bed fees (Healthcare Services)". So 0%.)
        ("SURGERY", "Minor", 10000.0, 0.0, "Abscess drainage, Stitches"),
        ("SURGERY", "Intermediate", 45000.0, 0.0, "Appendix, Hernia"),
        ("SURGERY", "Major", 120000.0, 0.0, "Gallbladder, Joint Replacement"),
        ("SURGERY", "Complex", 350000.0, 0.0, "Cardiac Bypass, Neuro"),
        
        # CONSULTATION (Just in case)
        ("CONSULTATION", "Specialist", 1500.0, 0.0, "Standard Consultation"),
    ]
    
    for cat, name, price, gst, desc_text in items:
        if not db.query(models.PriceMaster).filter_by(name=name).first():
            db.add(models.PriceMaster(
                category=cat, name=name, price=price, gst_percent=gst, description=desc_text
            ))
    db.commit()

# [NEW] Seed Inventory Data
def seed_inventory():
    db = next(get_db())
    items = [
        ("Ventilator Circuit", "ICU", 20, 5),
        ("Sedation Kit", "ICU", 50, 10),
        ("Trauma IV Kit", "ER", 30, 8),
        ("Saline Pack", "General", 100, 20),
        ("OR Prep Kit", "Surgery", 15, 3),
        ("Sterile Gowns", "Surgery", 200, 25),
        ("PPE Kit", "General", 100, 15),
        ("Sanitization Kit", "General", 50, 15), # [NEW]
        ("Bed Linens", "General", 100, 20),      # [NEW]
        ("Gloves", "OPD", 500, 50),              # [NEW]
        ("Tongue Depressor", "OPD", 200, 20)     # [NEW]
    ]
    for name, cat, qty, reorder in items:
        if not db.query(models.InventoryItem).filter_by(name=name).first():
            db.add(models.InventoryItem(name=name, category=cat, quantity=qty, reorder_level=reorder))
    db.commit()

def seed_doctor_rooms():
    db = next(get_db())
    rooms = [
        ("Room-101", "Dr. Sharma"),
        ("Room-102", "Dr. Varma"),
        ("Room-103", "Dr. Iyer"),
        ("Room-104", "Dr. Reddy")
    ]
    for r_id, name in rooms:
        if not db.query(models.DoctorRoom).filter_by(id=r_id).first():
            db.add(models.DoctorRoom(id=r_id, doctor_name=name, status="IDLE"))
    db.commit()

seed_inventory()
seed_doctor_rooms()
seed_price_master() 

app = FastAPI(title="PHRELIS Hospital OS")


app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Security Config
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your_super_secret_hospital_key" 
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    staff_id: str
    password: str


class TriageDecision(BaseModel):
    esi_level: int = Field(..., ge=1, le=5, description="The ESI triage level")
    justification: str = Field(..., description="1-sentence clinical rationale")
    bed_type: str = Field(..., description="Recommended unit: ICU, ER, or Wards")
    acuity_label: str = Field(..., description="Short clinical label e.g., 'Hemodynamically Unstable'")
    recommended_actions: List[str] = Field(..., description="List of immediate medical actions")

class ICDClassification(BaseModel):
    icd_code: str
    official_description: str
    chapter_prefix: str
    confidence_score: float
    clinical_rationale: str
    triage_urgency: str # CRITICAL | URGENT | STABLE


COMMON_ER_MAP = {
    # --- CARDIOVASCULAR & RESPIRATORY (High Acuity) ---
    "chest pain": {
        "code": "R07.9", 
        "desc": "Chest pain, unspecified", 
        "urgency": "EMERGENCY",
        "rationale": "High-risk indicator for Acute Coronary Syndrome (ACS). Protocol requires immediate ECG to rule out myocardial infarction."
    },
    "shortness of breath": {
        "code": "R06.02", 
        "desc": "Shortness of breath", 
        "urgency": "EMERGENCY",
        "rationale": "Potential respiratory failure or Pulmonary Embolism. Requires immediate SpO2 and airway assessment."
    },
    "palpitations": {
        "code": "R00.2", 
        "desc": "Palpitations", 
        "urgency": "URGENT",
        "rationale": "Potential arrhythmia (Atrial Fibrillation/SVT). Requires ECG to assess hemodynamic stability."
    },

    # --- NEUROLOGICAL (Stroke/Seizure) ---
    "weakness": {
        "code": "R53.1", 
        "desc": "Weakness, unspecified", 
        "urgency": "EMERGENCY",
        "rationale": "If focal or sudden, highly suggestive of Stroke (CVA). 'Time is Brain' protocol applies; immediate CT Head required."
    },
    "slurred speech": {
        "code": "R47.81", 
        "desc": "Slurred speech", 
        "urgency": "EMERGENCY",
        "rationale": "Acute neurological deficit. Must rule out Ischemic/Hemorrhagic Stroke via immediate neurology consult."
    },
    "seizure": {
        "code": "G40.909", 
        "desc": "Seizure, unspecified", 
        "urgency": "EMERGENCY",
        "rationale": "Risk of status epilepticus and airway compromise. Requires immediate benzodiazepine protocol and EEG follow-up."
    },

    # --- TRAUMA & ACCIDENTS ---
    "fall": {
        "code": "W19.XXXA", 
        "desc": "Unspecified fall, initial encounter", 
        "urgency": "URGENT",
        "rationale": "Risk of occult fractures or internal hemorrhage, especially in geriatric patients on anticoagulants."
    },
    "bleeding": {
        "code": "R58", 
        "desc": "Hemorrhage, not elsewhere classified", 
        "urgency": "EMERGENCY",
        "rationale": "Risk of hypovolemic shock. Requires immediate pressure, fluid resuscitation, and CBC/Cross-match."
    },
    "head injury": {
        "code": "S09.90XA", 
        "desc": "Unspecified injury of head", 
        "urgency": "EMERGENCY",
        "rationale": "Risk of intracranial pressure (ICP) elevation or hematoma. Monitor GCS scores every 15 minutes."
    },

    # --- GASTRO & METABOLIC ---
    "vomiting": {
        "code": "R11.10", 
        "desc": "Vomiting, unspecified", 
        "urgency": "URGENT",
        "rationale": "Risk of dehydration and electrolyte imbalance. Assess for metabolic alkalosis and fluid responsiveness."
    },
    "dizziness": {
        "code": "R42", 
        "desc": "Dizziness and giddiness", 
        "urgency": "STABLE",
        "rationale": "Broad differential from vertigo to orthostatic hypotension. Check BP (lying/standing) and HINTS exam."
    },
    "allergic reaction": {
        "code": "T78.40XA", 
        "desc": "Allergy, unspecified", 
        "urgency": "EMERGENCY",
        "rationale": "Risk of Anaphylaxis. Monitor for stridor, wheezing, or hypotension. Epinephrine should be on standby."
    },

    # --- PEDIATRIC SPECIALS ---
    "pediatric fever": {
        "code": "R50.9", 
        "desc": "Fever, unspecified (Pediatric)", 
        "urgency": "URGENT",
        "rationale": "In infants <90 days, fever is an automatic sepsis workup. Risk of meningitis must be ruled out."
    },
    "dehydration": {
        "code": "E86.0", 
        "desc": "Dehydration", 
        "urgency": "URGENT",
        "rationale": "Common in pediatric gastro cases. Check capillary refill and mucous membranes for fluid deficit."
    }
}



class MedicalAgent:
    def __init__(self):
        # 2. GET API KEY EXPLICITLY
        api_key = os.getenv("GOOGLE_API_KEY")
        
        # Validation for a "Perfect" setup
        if not api_key or api_key == "your_api_key_here":
            print("[CRITICAL ERROR]: Google API Key is missing or invalid in .env")
            self.active = False
            return
        
        try:
            # 3. PASS API KEY EXPLICITLY TO THE CONSTRUCTOR
            # Use 'api_key' parameter to ensure LangChain receives it correctly
            # self.llm = ChatGoogleGenerativeAI(
            #     model="models/gemini-flash-latest", 
            #     temperature=0,
            #     api_key=api_key  # Pass it here explicitly
            # )
            self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite-preview", # Switch to Lite for max speed
            temperature=0,
            api_key=api_key,
            thinking_level="minimal", 
            max_output_tokens=500  # Triage JSON is short; don't let it "wander"
            )
            
            # Using Structured Output for Senior Dev accuracy
            self.structured_llm = self.llm.with_structured_output(TriageDecision)
            self.active = True
            print("[OK] Medical AI Agent linked and active.")
        except Exception as e:
            print(f"[ERROR] Initialization Failed: {e}")
            self.active = False
            
    async def analyze_patient(self, symptoms: List[str], vitals: dict) -> TriageDecision:
        if not self.active:
            return TriageDecision(
                esi_level=3, 
                justification="Protocol fallback: AI offline.",
                bed_type="ER",
                acuity_label="Standard Priority",
                recommended_actions=["Standard Vitals"]
            )

        system_prompt = (
    "You are a Senior Clinical Triage Decision Engine for Phrelis Hospital OS.\n\n"
    
    "### LOGIC HIERARCHY (ESI v5 Protocol):\n"
    "1. ESI 1: Immediate life-saving intervention (e.g., Code Blue, Full Obstruction).\n"
    "2. ESI 2: High-risk situation (e.g., Active Chest Pain, Stroke signs, SpO2 < 90%).\n"
    "3. ESI 3: Stable, requires multiple resources (Labs + IV + Imaging).\n"
    "4. ESI 4: Stable, requires one resource (e.g., simple X-ray, sutures).\n"
    "5. ESI 5: Stable, requires zero resources (e.g., prescription refill).\n\n"

    "### CLINICAL CORRELATION LOGIC:\n"
    "Analyze symptoms for underlying nutritional or systemic deficiencies:\n"
    " - Paresthesia (Tingling/Numbness) in fingers/toes: Assess for Vitamin B12 deficiency or Peripheral Neuropathy.\n"
    " - Extreme Fatigue + Pallor: Assess for Iron-deficiency Anemia.\n"
    " - Polyuria + Polydipsia: Assess for Hyperglycemia/Diabetes.\n\n"

    "### OUTPUT REQUIREMENTS:\n"
    "Return a JSON object only. The 'clinical_justification' must follow this format:\n"
    "'Level [X] assigned. Symptoms of [Symptom] suggest potential [Condition] (e.g., B12 deficiency), "
    "requiring [Resource Name] to prevent [Complication].'\n\n"

    "### CONSTRAINTS:\n"
    " - Map ESI 1-2 -> ICU | ESI 3 -> ER | ESI 4-5 -> Wards.\n"
    " - RETURN ONLY JSON: {'esi_level': int, 'location': str, 'clinical_justification': str}"
)
        
        user_input = f"Symptoms: {symptoms}. Vitals: {vitals}."
        
        try:
            # We call the structured LLM directly
            return await self.structured_llm.ainvoke([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ])
        except Exception as e:
            print(f"AI Execution Error: {e}")
            # Reliable safety fallback for a medical app
            return TriageDecision(
                esi_level=3, 
                justification="Safety fallback due to system error.", 
                bed_type="ER",
                acuity_label="System Alert",
                recommended_actions=["Manual Triage Required"]
            )

    def _get_local_fallback(self, complaint: str) -> dict:
        complaint_low = complaint.lower()
    
    # 1. Create a priority-sorted list of keys based on urgency
    # This ensures "chest pain" is caught before "dizziness" if both are present
        priority_order = ["EMERGENCY", "URGENT", "STABLE"]
    
        for level in priority_order:
            for key, data in COMMON_ER_MAP.items():
                if data["urgency"] == level and key in complaint_low:
                    return data
                
    # 2. Ultimate generic fallback
        return {
        "code": "R69", 
        "desc": "Illness, unspecified", 
        "urgency": "STABLE", 
        "rationale": "Non-specific complaint. Monitoring vitals for escalation signs."
        }
    async def classify_icd(self, complaint: str, symptoms: List[str]) -> ICDClassification:
        # 1. Immediate exit if agent is inactive
        if not self.active:
            fallback = self._get_local_fallback(complaint)
            return ICDClassification(
                icd_code=fallback["code"],
                official_description=f"{fallback['desc']}",
                chapter_prefix=fallback["code"][0],
                confidence_score=0.1,
                clinical_rationale=fallback["rationale"],
                triage_urgency=fallback["urgency"]
            )

        system_prompt = (
            "You are the Phrelis OS Clinical Intelligence Core, a high-precision medical classification engine. "
            "Your purpose is to map unstructured patient data to the ICD-10-CM (2026 Edition) ontology for real-time triage prioritization.\n\n"
            "OPERATIONAL LOGIC:\n"
            "1. Anatomical Mapping: Identify the primary system (e.g., I=Circulatory, J=Respiratory, G=Nervous).\n"
            "2. Acuity Assessment: If keywords like 'sudden', 'sharp', 'crushing', or 'severe' are present, prioritize Acute classifications.\n"
            "3. Specificity Rule: Provide the most accurate 3-to-5 character category (e.g., I21.9 for unspecified MI).\n\n"
            "Return a JSON object following the ICDClassification schema accurately."
        )
        
        user_input = f"Primary Complaint: {complaint}. Supporting Symptoms: {symptoms}."
        
        try:
            # Create the structured output generator
            structured_icd = self.llm.with_structured_output(ICDClassification)
            
            # 2. THE RACE: 10 SECOND TIMEOUT
            # If Gemini takes more than 10s, it raises asyncio.TimeoutError
            return await asyncio.wait_for(
                structured_icd.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ]),
                timeout=10
            )

        except (asyncio.TimeoutError, Exception) as e:
            # 3. FALLBACK TRIGGER
            error_type = "TIMEOUT" if isinstance(e, asyncio.TimeoutError) else "PROCESSING ERROR"
            print(f"[{error_type}]: Switched to Local Fallback for {complaint}")
            
            fallback = self._get_local_fallback(complaint)
            return ICDClassification(
                icd_code=fallback["code"],
                official_description=fallback["desc"],
                chapter_prefix=fallback["code"][0],
                confidence_score=0.0,
                clinical_rationale=fallback["rationale"],
                triage_urgency=fallback["urgency"]
            )
# 4. INITIALIZE THE AGENT AFTER LOAD_DOTENV()
ai_agent = MedicalAgent()

# Connection Manager for WebSockets 
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --- Pydantic Models ---
class AdmissionRequest(BaseModel):
    bed_id: str
    patient_name: str
    patient_age: int
    gender: str
    condition: str
    staff_id: str

class TriageRequest(BaseModel):
    patient_name: str
    patient_age: int
    gender: str
    symptoms: List[str]
    vitals: Optional[dict] = {}

class AmbulanceRequest(BaseModel):
    severity: str 
    location: str
    eta: int

class StaffClockIn(BaseModel):
    staff_id: str

class StaffAssign(BaseModel):
    staff_id: str
    bed_id: str
    role: str 

class TaskUpdate(BaseModel):
    task_id: int
    status: str

class EventCreate(BaseModel):
    patient_id: str
    event_type: str
    details: Optional[str] = None

class PredictionCreate(BaseModel):
    prediction_text: str
    target_department: str
    predicted_delay_minutes: int

# Surgery Specific Models
class SurgeryStartRequest(BaseModel):
    bed_id: str
    patient_name: str
    patient_age: int
    surgeon_name: str
    surgery_type: str # [NEW] e.g., "Minor", "Intermediate", "Major", "Complex"
    duration_minutes: int
    admission_uid: Optional[str] = None # [NEW] Link to existing stay if any

class SurgeryExtendRequest(BaseModel):
    additional_minutes: int

# OPD Queue Models
class QueueCheckInRequest(BaseModel):
    patient_name: str
    patient_age: int
    gender: str
    base_acuity: int # 1-5
    vitals: dict # {hr, bp, spo2}
    symptoms: List[str]
    icd_code: Optional[str] = None
    icd_rationale: Optional[str] = None
    triage_urgency: Optional[str] = None
#  Admin ERP Endpoints 


# Logic to generate smart tasks based on condition
def generate_smart_tasks(db: Session, bed_id: str, condition: str,patient_id: str = None):
    tasks = []
    now = datetime.utcnow()
    
    # Ensure condition is a string to prevent errors
    cond_lower = str(condition).lower() if condition else ""

    if "critical" in cond_lower or "resuscitation" in cond_lower:
        tasks = [
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Q15m Vital Signs Monitor", due_time=now + timedelta(minutes=15), priority="Critical"),
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Check Arterial Line / IV Patency", due_time=now + timedelta(hours=1), priority="High"),
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Emergency Meds Preparation", due_time=now + timedelta(minutes=30), priority="Critical")
        ]
    elif "pre-surgery" in cond_lower or "pre sugrey" in cond_lower:
        tasks = [
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Confirm NPO Status", due_time=now + timedelta(hours=1), priority="High"),
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Verify Surgical Consent", due_time=now + timedelta(hours=2), priority="Medium")
        ]
    elif "observation" in cond_lower:
        tasks = [
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Hourly Neuro Check", due_time=now + timedelta(hours=1), priority="Medium")
        ]
    else: # Stable
        tasks = [
            models.Task(bed_id=bed_id,patient_id=patient_id, description="Routine Ward Rounds", due_time=now + timedelta(hours=4), priority="Low")
        ]
    
    if tasks:
        db.add_all(tasks)
        db.commit()

@app.get("/api/tasks/sync-all")
async def sync_existing_patients(db: Session = Depends(get_db)):
    # Find all occupied beds
    occupied_beds = db.query(models.BedModel).filter(models.BedModel.is_occupied == True).all()
    
    for bed in occupied_beds:
        # Check if tasks already exist to avoid duplicates
        existing_tasks = db.query(models.Task).filter(models.Task.bed_id == bed.id, models.Task.status == "Pending").first()
        
        if not existing_tasks:
            # Use the protocol function
            generate_smart_tasks(db, bed.id, bed.condition or "Stable")
            
    # Tell the frontend to update via WebSocket
    await manager.broadcast({"type": "REFRESH_RESOURCES"})
    return {"message": f"Tasks generated for {len(occupied_beds)} patients"}


# Change the route to include {patient_id}
@app.post("/api/radiology/scan/{patient_id}") 
async def scan_xray(
    patient_id: str, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    if not radiology_ai.active:
        raise HTTPException(status_code=503, detail="Radiology AI offline")
    
    # 1. Read file bytes
    image_bytes = await file.read()
    
    # 2. Run AI Analysis
    findings = await radiology_ai.analyze(image_bytes)
    
    # 3. Clinical Logic: Check for critical findings
    # (Example: Pneumothorax or Effusion > 0.6 is a medical emergency)
    critical_pathologies = ["Pneumothorax", "Effusion", "Pneumonia"]
    is_critical = any(findings.get(p, 0) > 0.6 for p in critical_pathologies)
    
    # 4. 1st Place Feature: Real-time Alert
    if is_critical:
        await manager.broadcast({
            "type": "CRITICAL_FINDING",
            "patient_id": patient_id,
            "message": f"🚨 URGENT: Critical findings for Patient {patient_id} in Radiology.",
            "urgency": "High"
        })
        
        # Optional: Log this finding into the patient's condition in DB
        record = db.query(models.PatientRecord).filter(models.PatientRecord.id == patient_id).first()
        if record:
            record.condition += f" | AI-RAD-ALERT: Critical finding detected."
            db.commit()

    return {
        "status": "Analysis Complete",
        "patient_id": patient_id,
        "is_critical": is_critical,
        "findings": findings
    }


@app.post("/api/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Look for the staff member
    staff = db.query(models.Staff).filter(models.Staff.id == request.staff_id).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff ID not found in database")
    
    # HIPAA: Log Successful Login
    log_audit_event(
        db=db,
        staff_id=staff.id,
        role=staff.role,
        action="SUCCESSFUL_LOGIN",
        resource_path="/api/login",
        ip_address="unknown", 
        details=f"Staff {staff.name} logged in successfully."
    )

    # Generate token 
    access_token = jwt.encode({
        "sub": staff.id, 
        "role": staff.role,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": access_token, 
        "role": staff.role, 
        "staff_id": staff.id
    }

@app.post("/api/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    # HIPAA: Log Manual Logout
    log_audit_event(
        db=db,
        staff_id=current_user.staff_id,
        role=current_user.role,
        action="MANUAL_LOGOUT",
        resource_path="/api/logout",
        ip_address=request.client.host if request.client else "unknown",
        details=f"Staff {current_user.name} logged out manually."
    )
    return {"message": "Logged out successfully"}

@app.get("/api/admin/audit-logs")
async def get_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    # Guard: Only Admin role
    if current_user.role != "Admin":
        # HIPAA: Log Security Breach Attempt
        log_audit_event(
            db=db,
            staff_id=current_user.staff_id,
            role=current_user.role,
            action="CRITICAL_SECURITY_BREACH",
            resource_path="/api/admin/audit-logs",
            ip_address=request.client.host if request.client else "unknown",
            details=f"UNAUTHORIZED ACCESS ATTEMPT by {current_user.name} ({current_user.role})"
        )
        raise HTTPException(status_code=403, detail="CRITICAL_SECURITY_BREACH: Access Denied.")

    # If Admin, return logs
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return logs


# ===== INVENTORY MANAGEMENT ENDPOINTS =====

class InventoryAddRequest(BaseModel):
    name: str
    category: str
    quantity: int
    reorder_level: int

@app.get("/api/inventory/forecast")
async def get_inventory_forecast(db: Session = Depends(get_db)):
    """
    Returns inventory with burn rate calculations and predictive status.
    """
    items = db.query(models.InventoryItem).all()
    forecast_data = []
    
    for item in items:
        # Calculate burn rate from recent usage logs (last 24 hours)
        recent_logs = db.query(models.InventoryLog).filter(
            models.InventoryLog.item_id == item.id,
            models.InventoryLog.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        total_used = sum(log.quantity_used for log in recent_logs)
        burn_rate = total_used / 24.0  # units per hour
        
        # Calculate hours remaining
        if burn_rate > 0.1:
            hours_remaining = int(item.quantity / burn_rate)
        else:
            hours_remaining = 9999
        
        # Determine status
        if hours_remaining < 12:
            status = "Critical"
        elif hours_remaining < 48:
            status = "Warning"
        else:
            status = "Normal"
        
        forecast_data.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "reorder_level": item.reorder_level,
            "burn_rate": round(burn_rate, 2),
            "hours_remaining": hours_remaining,
            "status": status
        })
    
    return forecast_data

@app.post("/api/inventory/add")
async def add_inventory_item(
    request: InventoryAddRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin)  # Admin-only
):
    """
    Add a new inventory item. Admin-only endpoint.
    """
    # Check if item already exists
    existing = db.query(models.InventoryItem).filter(
        models.InventoryItem.name == request.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Item '{request.name}' already exists")
    
    # Validate inputs
    if request.quantity < 0 or request.reorder_level < 0:
        raise HTTPException(status_code=400, detail="Quantity and reorder level must be non-negative")
    
    # Create new item
    new_item = models.InventoryItem(
        name=request.name,
        category=request.category,
        quantity=request.quantity,
        reorder_level=request.reorder_level
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Broadcast update
    await manager.broadcast({"type": "REFRESH_INVENTORY"})
    
    return {
        "message": "Inventory item added successfully",
        "item": {
            "id": new_item.id,
            "name": new_item.name,
            "category": new_item.category,
            "quantity": new_item.quantity,
            "reorder_level": new_item.reorder_level
        }
    }


class InventoryRestockRequest(BaseModel):
    item_id: int
    quantity_to_add: int

@app.patch("/api/inventory/restock")
async def restock_inventory_item(
    request: InventoryRestockRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin)  # Admin-only
):
    """
    Add quantity to an existing inventory item. Admin-only endpoint.
    """
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == request.item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail=f"Item with ID {request.item_id} not found")
    
    if request.quantity_to_add <= 0:
        raise HTTPException(status_code=400, detail="Quantity to add must be positive")
    
    old_quantity = item.quantity
    item.quantity += request.quantity_to_add
    
    db.commit()
    db.refresh(item)
    
    await manager.broadcast({"type": "REFRESH_INVENTORY"})
    
    return {
        "message": f"Successfully restocked {item.name}",
        "item": {
            "id": item.id,
            "name": item.name,
            "old_quantity": old_quantity,
            "new_quantity": item.quantity,
            "added": request.quantity_to_add
        }
    }


@app.post("/api/erp/admit")
async def admit_patient(
    request: AdmissionRequest, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin_or_doctor)  # [RBAC] Only Admin or Doctor can admit
):
    # 1. Find the bed with a lock to prevent double-booking
    bed = db.query(models.BedModel).filter(models.BedModel.id == request.bed_id).with_for_update().first()
    
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    # 2. Robust Safety Checks
    # Check Gender Compatibility for Medical Wards
    if getattr(bed, 'unit', None) == "Medical Ward" and getattr(bed, 'gender', 'Any') != "Any":
        # Standardizing input: 'Other' and 'Male' go to 'M'
        target_gender = "M" if request.gender in ["Male", "Other"] else "F"
        if bed.gender != target_gender:
            raise HTTPException(
                status_code=400, 
                detail=f"Clinical Safety Alert: This bed is reserved for {bed.gender} patients."
            )
    
    # Infection Control Override
    infectious_keywords = ["fever", "cough", "contagious", "pathogen", "isolation", "infectious"]
    is_infectious = any(k in request.condition.lower() for k in infectious_keywords)
    
    if is_infectious and getattr(bed, 'unit', None) != "Isolation":
         raise HTTPException(
             status_code=400, 
             detail="Infection Control: Infectious patients must be admitted to an Isolation Unit."
         )

    # Occupancy check
    if bed.is_occupied:
         raise HTTPException(status_code=400, detail=f"Bed {bed.id} is already occupied.")

    # 3. Update Bed Data
    bed.is_occupied = True
    bed.patient_name = request.patient_name
    bed.condition = request.condition
    bed.status = "OCCUPIED" 
    bed.admission_time = datetime.utcnow() # Track for IST normalization
    bed.admission_uid = None # Will be set below
    
    if hasattr(bed, 'patient_age'): 
        bed.patient_age = request.patient_age

    # [NEW] Ensure billing category is updated based on unit type
    if bed.type == "ICU":
        bed.billing_category = "ICU"
    elif bed.type == "Surgery":
        bed.billing_category = "Private"
    elif bed.type == "ER":
        bed.billing_category = "Ward" # ER usually Ward rate or separate
    else:
        bed.billing_category = bed.billing_category or "Ward"

    # [NEW] Create Financial Admission Record
    new_admission_uid = f"ADM-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
   
    # Save UID to bed and record for history tracking
    bed.admission_uid = new_admission_uid
    bed.created_by_uid = current_user.staff_id  # [RBAC] Track who admitted the patient
    
    # 4. Create Persistent Patient Record
    new_patient_id = str(uuid.uuid4())
    new_record = models.PatientRecord(
        id=new_patient_id,
        bed_id=request.bed_id,
        gender=request.gender, # Save gender for the record
        esi_level=3, 
        acuity="Direct Admission",
        symptoms=[request.condition],
        timestamp=datetime.utcnow(),
        patient_name=request.patient_name,
        patient_age=request.patient_age,
        condition=request.condition,
        assigned_staff=request.staff_id,
        admission_uid=new_admission_uid # [NEW]
    )
    new_admission = models.Admission(
        admission_uid=new_admission_uid,
        patient_id=new_patient_id,
        bed_id=request.bed_id,
        patient_name=request.patient_name,
        patient_age=request.patient_age,
        status="ACTIVE",
        created_by_uid=current_user.staff_id  # [RBAC] Track who created the admission
    )
    
    try:
        db.add(new_record)
        db.add(new_admission) # Add Admission
        db.commit()
        db.refresh(bed)
        
        # 5. Trigger Smart Worklist & Real-time Sync
        generate_smart_tasks(db, bed.id, request.condition, patient_id=new_patient_id)

        # 6. INVENTORY SYNC
        # [NEW] Item Deduction for Admission
        inv_context = bed.type # ICU, ER, Surgery, Wards
        await InventoryService.process_usage(
            db, manager, inv_context, 
            {
                "patient_name": request.patient_name, 
                "bed_id": bed.id, 
                "condition": request.condition,
                "admission_uid": new_admission_uid # [NEW]
            }
        )
        
        await manager.broadcast({
            "type": "BED_UPDATE", 
            "bed_id": bed.id, 
            "new_status": "OCCUPIED",
            "patient_gender": request.gender
        })
        
        return {"message": "Admission Successful", "bed_id": bed.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Sync Failed: {str(e)}")


@app.post("/api/tasks/complete/{task_id}")
async def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update status to something that WON'T match the dashboard filter
    task.status = "Completed"
    task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task) # Ensure the object is updated with DB state
    
    # CRITICAL: If you have a WebSocket manager, broadcast the refresh
    # This tells the frontend "Something changed, re-fetch your data!"
    try:
        await manager.broadcast({"type": "REFRESH_RESOURCES"})
    except:
        pass # Fallback if manager isn't initialized
        
    return {"status": "success", "task_id": task_id}


@app.get("/api/erp/beds")
def list_beds(db: Session = Depends(get_db)):
    return db.query(models.BedModel).all()

@app.post("/api/erp/discharge/{bed_id}")
async def discharge(
    bed_id: str, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin_or_doctor)  # [RBAC] Only Admin or Doctor can discharge
):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if bed:
        # Update History Record (Find latest record for this patient)
        if bed.patient_name:
            history_record = db.query(models.PatientRecord).filter(
                models.PatientRecord.patient_name == bed.patient_name,
                models.PatientRecord.discharge_time == None
            ).order_by(models.PatientRecord.timestamp.desc()).first()
            
            if history_record:
                history_record.discharge_time = datetime.utcnow()
        
        # [NEW] Financial Discharge & Bill Generation
        active_admission = db.query(models.Admission).filter(
            models.Admission.bed_id == bed_id,
            models.Admission.status == "ACTIVE"
        ).first()
        
        bill_data = None
        if active_admission:
            active_admission.discharge_time = datetime.utcnow()
            active_admission.status = "DISCHARGED"
            # Generate Bill
            new_bill = BillingService.generate_bill(db, active_admission.admission_uid)
            bill_data = {
                "bill_no": new_bill.bill_no,
                "grand_total": new_bill.grand_total
            }
        
        db.query(models.Task).filter(
            models.Task.bed_id == bed_id, 
            models.Task.status == "Pending"
        ).update({"status": "Cancelled"}) # Or delete them

        bed.is_occupied = False
        bed.status = "DIRTY"
        bed.patient_name = None
        bed.patient_age = None
        bed.condition = None
        bed.ventilator_in_use = False
        db.commit()
        
        await manager.broadcast({
            "type": "BED_UPDATE", 
            "bed_id": bed.id, 
            "new_status": "DIRTY",
            "color_code": bed.get_color_code()
        })
        
        if bill_data:
            return {"status": "success", "bill": bill_data}
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Bed not found")


@app.post("/api/erp/beds/{bed_id}/start-cleaning")
async def start_cleaning(bed_id: str, db: Session = Depends(get_db)):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    bed.status = "CLEANING"
    db.commit()
    
    # [NEW] Inventory Usage for Cleaning
    await InventoryService.process_usage(
        db, manager, "Cleaning", 
        {"patient_name": "Bed Turnover", "bed_id": bed.id, "condition": "Standard Cleaning"}
    )

    await manager.broadcast({
        "type": "BED_UPDATE", 
        "bed_id": bed.id, 
        "new_status": "CLEANING",
        "color_code": bed.get_color_code()
    })
    return {"status": "success"}

@app.post("/api/erp/beds/{bed_id}/cleaning-complete")
async def cleaning_complete(bed_id: str, db: Session = Depends(get_db)):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    bed.status = "AVAILABLE"
    # Ensure is_occupied is false just in case
    bed.is_occupied = False 
    db.commit()
    
    await manager.broadcast({
        "type": "BED_UPDATE", 
        "bed_id": bed.id, 
        "new_status": "AVAILABLE",
        "color_code": bed.get_color_code()
    })
    return {"status": "success"}



@app.post("/api/surgery/start")
async def start_surgery(
    request: SurgeryStartRequest, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin_or_doctor)  # [RBAC] Only Admin or Doctor can start surgery
):
    bed = db.query(models.BedModel).filter(models.BedModel.id == request.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    now = datetime.now(timezone.utc)
    
    bed.patient_name = request.patient_name
    bed.surgeon_name = request.surgeon_name
    bed.patient_age = request.patient_age
    bed.admission_time = now
    bed.surgery_type = request.surgery_type # [NEW]
    
    # [NEW] Handle Admission UID - either provided from existing stay or generated fresh
    target_uid = request.admission_uid
    if not target_uid:
        # If it's a direct surgery without prior admission, generate a UID
        target_uid = f"ADM-SRG-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        # Create a matching Admission record so billing works
        new_admission = models.Admission(
            admission_uid=target_uid,
            patient_id=str(uuid.uuid4()), # Placeholder or link to existing if you had a global patient table
            bed_id=request.bed_id,
            patient_name=request.patient_name,
            patient_age=request.patient_age,
            status="ACTIVE",
            created_by_uid=current_user.staff_id  # [RBAC] Track who initiated surgery
        )
        db.add(new_admission)
    
    bed.admission_uid = target_uid # [NEW]
    bed.created_by_uid = current_user.staff_id  # [RBAC] Track who started surgery
    
    # Logic Fix: Handle the 0 duration case cleanly
    iso_time = None
    if request.duration_minutes > 0:
        bed.expected_end_time = now + timedelta(minutes=request.duration_minutes)
        iso_time = bed.expected_end_time.isoformat().replace("+00:00", "Z")
    else:
        bed.expected_end_time = None
    
    bed.current_state = "OCCUPIED"
    bed.status = "OCCUPIED"
    bed.is_occupied = True
    
    db.commit()
    db.refresh(bed)

    # REMOVED the duplicate iso_time assignment that was causing the crash

    await manager.broadcast({
        "type": "SURGERY_UPDATE",
        "bed_id": bed.id,
        "state": "OCCUPIED",
        "patient_name": bed.patient_name,
        "expected_end_time": iso_time
    })

    # [NEW] Inventory Hook
    await InventoryService.process_usage(
        db, manager, "Surgery", 
        {"patient_name": bed.patient_name, "bed_id": bed.id, "condition": "Surgery Start"}
    )

    return {"status": "started", "end_time": iso_time}

from datetime import datetime, timezone, timedelta

@app.post("/api/surgery/extend/{bed_id}")
async def extend_surgery(bed_id: str, request: SurgeryExtendRequest, db: Session = Depends(get_db)):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if not bed: raise HTTPException(404, "Bed not found")
    
    now = datetime.now(timezone.utc)

    if bed.expected_end_time and bed.expected_end_time.tzinfo is None:
        bed.expected_end_time = bed.expected_end_time.replace(tzinfo=timezone.utc)

    if not bed.expected_end_time or bed.expected_end_time < now:
        bed.expected_end_time = now + timedelta(minutes=request.additional_minutes)
    else:
        bed.expected_end_time += timedelta(minutes=request.additional_minutes)
    
    bed.current_state = "OCCUPIED"
    bed.status = "OCCUPIED"
    db.commit()
    db.refresh(bed)

    # FIX: Use replace to ensure a clean 'Z' for the frontend
    iso_time = bed.expected_end_time.isoformat().replace("+00:00", "Z")

    await manager.broadcast({
        "type": "SURGERY_EXTENDED",
        "bed_id": bed.id,
        "state": "OCCUPIED",
        "expected_end_time": iso_time
    })
    return {"status": "extended", "new_end_time": iso_time}



@app.post("/api/surgery/complete/{bed_id}")
async def complete_surgery(
    bed_id: str, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin_or_doctor)  # [RBAC] Only Admin or Doctor can complete surgery
):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if not bed: raise HTTPException(404, "Bed not found")
    
    actual_end_time = datetime.now(timezone.utc)
    start_time = bed.admission_time
    if start_time and start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    if not start_time:
        start_time = actual_end_time

    # Calculate metrics for history
    total_duration = (actual_end_time - start_time).total_seconds() / 60
    overtime = 0
    if bed.expected_end_time:
        expected = bed.expected_end_time
        if expected.tzinfo is None: expected = expected.replace(tzinfo=timezone.utc)
        if actual_end_time > expected:
            overtime = (actual_end_time - expected).total_seconds() / 60
            
    history_entry = models.SurgeryHistory(
        room_id=bed.id,
        patient_name=bed.patient_name or "Unknown Patient",
        patient_age=bed.patient_age,
        surgeon_name=bed.surgeon_name or "Unknown Surgeon",
        start_time=start_time,
        end_time=actual_end_time,
        total_duration_minutes=int(total_duration),
        overtime_minutes=int(overtime) if overtime > 0 else 0,
        surgery_type=bed.surgery_type, # [NEW]
        admission_uid=bed.admission_uid # [NEW]
    )
    
    db.add(history_entry)
    
    # [NEW] Financial Log for Surgery
    # Use the admission_uid explicitly stored on bed or found in db
    target_uid = bed.admission_uid
    if not target_uid:
        # Fallback to search if not explicitly passed at start
        active_adm = db.query(models.Admission).filter(
            models.Admission.bed_id == bed_id,
            models.Admission.status == "ACTIVE"
        ).first()
        if active_adm: target_uid = active_adm.admission_uid
    
    if target_uid:
        # Use the surgery type selected at start
        surgery_type = bed.surgery_type or "Minor"
        
        # Get Price
        price = BillingService.get_price(db, surgery_type)
        
        surgery_log = models.SurgeryLog(
            admission_uid=target_uid,
            surgery_name=surgery_type,
            price_at_time=price,
            notes=f"Surgeon: {bed.surgeon_name}, Duration: {int(total_duration)}m"
        )
        db.add(surgery_log)

        # [NEW] Item Deduction for Surgery - Deduct items for this surgery type
        await InventoryService.process_usage(
            db, manager, surgery_type, 
            {
                "patient_name": bed.patient_name, 
                "bed_id": bed.id, 
                "condition": f"Surgery: {surgery_type}",
                "admission_uid": target_uid
            }
        )
    
    bed.current_state = "DIRTY"
    bed.status = "DIRTY"
    bed.admission_time = None 
    bed.expected_end_time = None 
    # Optional: Clear these if you want the "Dirty" card to be anonymous
   
    db.commit()
    
    await manager.broadcast({
        "type": "SURGERY_UPDATE", 
        "bed_id": bed.id, 
        "state": "DIRTY",
        "patient_name": bed.patient_name,
        "surgeon_name": bed.surgeon_name,
        "expected_end_time": None
    })
    return {"status": "completed"}

@app.post("/api/surgery/release/{bed_id}")
async def release_surgery_room(bed_id: str, db: Session = Depends(get_db)):
    bed = db.query(models.BedModel).filter(models.BedModel.id == bed_id).first()
    if not bed: 
        raise HTTPException(404, "Bed not found")
    
    # FULL RESET of all fields to prevent data leaking to the next patient
    bed.current_state = "AVAILABLE"
    bed.status = "AVAILABLE"
    bed.is_occupied = False
    bed.patient_name = None
    bed.patient_age = None
    bed.surgeon_name = None
    bed.admission_time = None 
    bed.expected_end_time = None 
    
    db.commit()
    
    await manager.broadcast({
        "type": "ROOM_RELEASED",
        "bed_id": bed.id,
        "state": "AVAILABLE",
        "expected_end_time": None 
    })
    return {"status": "released"}
@app.post("/api/triage/assess")
async def assess_patient(request: TriageRequest, db: Session = Depends(get_db)):
    # 1. Ask Gemini for clinical decision (ESI Level & Target Unit)
    # Gemini returns "ICU", "ER", or "Wards"
    decision = await ai_agent.analyze_patient(request.symptoms, request.vitals)
    
    level = decision.esi_level
    bed_type = decision.bed_type 
    
    # 2. Gender Logic for Wards
    # Requirements: 'Other' and 'Male' go to Male Ward ('M'). 'Female' goes to Female Ward ('F').
    target_bed_gender = "M" if request.gender in ["Male", "Other"] else "F"
    
    # 3. Critical System Check (Ventilator Requirement)
    spo2 = request.vitals.get("spo2", 100)
    ventilator_needed = spo2 < 88 and level <= 2
    
    # 4. Find Available Bed with Database Locking
    query = db.query(models.BedModel).filter(
        models.BedModel.type == bed_type, 
        models.BedModel.is_occupied == False,
        models.BedModel.status == "AVAILABLE"
    )

    # Apply Gender Constraint ONLY if the target is a Ward
    # ICU and ER remain gender-neutral for emergency speed
    if bed_type == "Wards":
        query = query.filter(models.BedModel.gender == target_bed_gender)

    # Use with_for_update to prevent race conditions during high-concurrency
    bed = query.with_for_update(skip_locked=True).first()

    # 5. Create Patient Record
    new_patient_id = str(uuid.uuid4())
    new_record = models.PatientRecord(
        id=new_patient_id,
        esi_level=level,
        acuity=bed_type,
        gender=request.gender, # Audit trail
        symptoms=request.symptoms,
        timestamp=datetime.utcnow(),
        patient_name=request.patient_name, 
        patient_age=request.patient_age,
        condition=f"ESI {level}: {decision.justification}"
    )
    db.add(new_record)

    assigned_id = "WAITING_LIST"
    new_admission_uid = None
    
    # 6. Final Allocation
    if bed:
        bed.is_occupied = True
        bed.status = "OCCUPIED"
        bed.patient_name = request.patient_name
        bed.condition = new_record.condition
        bed.ventilator_in_use = ventilator_needed
        assigned_id = bed.id
        
        # [NEW] Create Financial Admission Record for Triage
        new_admission_uid = f"ADM-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        new_admission = models.Admission(
            admission_uid=new_admission_uid,
            patient_id=new_patient_id,
            bed_id=bed.id,
            patient_name=request.patient_name,
            patient_age=request.patient_age,
            status="ACTIVE"
        )
        db.add(new_admission)
        
        # Trigger Smart Nursing Worklist tasks
        generate_smart_tasks(db, bed.id, bed.condition, patient_id=new_patient_id)

    db.commit()

    # 7. Real-time Broadcast to Dashboard
    await manager.broadcast({
        "type": "NEW_ADMISSION", 
        "bed_id": assigned_id,
        "patient_gender": request.gender,
        "is_critical": level <= 2
    })

    # [NEW] Inventory Hook for Triage Admissions
    if bed:
        # Determine context based on the assigned bed type
        inv_context = bed.type # ICU, ER, Surgery, Wards
        
        # Trigger inventory deduction shared logic
        await InventoryService.process_usage(
            db, manager, inv_context, 
            {
                "patient_name": request.patient_name, 
                "bed_id": bed.id, 
                "condition": new_record.condition,
                "admission_uid": new_admission_uid # [FIXED]
            }
        )

    return {
        "patient_name": request.patient_name,  # Added
        "acuity": bed_type,                    # Added (e.g., "ICU", "ER", "Wards")
        "patient_name": request.patient_name,
        "patient_age": request.patient_age,
        "esi_level": level,
        "esi_level": level,
        "acuity": f"Priority {level}: {decision.acuity_label}",
        "assigned_bed": assigned_id,
        "ai_justification": decision.justification,
        "recommended_actions": decision.recommended_actions,
        "patient_age": request.patient_age
    }



@app.get("/api/history/day/{target_date}")
def get_history_by_day(target_date: date, db: Session = Depends(get_db)):
    # Join with Admission to get the admission_uid
    # Use outerjoin so that patients without admissions (Waiting List) still show up
    results = db.query(
        models.PatientRecord,
        models.Admission.admission_uid
    ).outerjoin(
        models.Admission, 
        models.PatientRecord.id == models.Admission.patient_id
    ).filter(
        func.date(models.PatientRecord.timestamp) == target_date
    ).order_by(models.PatientRecord.timestamp.desc()).all()
    
    # Flatten results
    history = []
    for record, joined_uid in results:
        record_dict = {c.name: getattr(record, c.name) for c in record.__table__.columns}
        # Use direct field first, then fallback to joined for legacy data
        record_dict["admission_uid"] = record.admission_uid or joined_uid
        history.append(record_dict)

    return history

@app.get("/api/history/surgery")
def get_surgery_history(db: Session = Depends(get_db)):
    try:
        # Fetching end_time for surgery
        history = db.query(models.SurgeryHistory).order_by(models.SurgeryHistory.end_time.desc()).all()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/opd")
def get_opd_history(db: Session = Depends(get_db)):
    try:
        records = db.query(models.PatientQueue).filter(
            models.PatientQueue.status == "COMPLETED"
        ).order_by(models.PatientQueue.check_in_time.desc()).all()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- OPD Triage & Queue Logic ---


# --- Integrated ICD-10 Priority Logic ---

# Chapter-based weights (Industry standard approach)
ICD_CHAPTER_WEIGHTS = {
    "I": 40,  # Circulatory System
    "J": 35,  # Respiratory System
    "S": 30,  # Injury, poisoning (Trauma)
    "T": 30,  # External causes
    "G": 25,  # Nervous system
    "A": 15,  # Infectious and parasitic
    "B": 15,  # Infectious and parasitic
    "E": 20,  # Endocrine/Metabolic
    "L": 5,   # Skin diseases (Lower priority)
}

def calculate_priority_index(patient: models.PatientQueue):
    """
    Phrelis Triage Algorithm v2.5 (ICD-10 Integrated)
    """
    # 1. Base ESI: (6 - Level) * 20
    score = (6 - patient.base_acuity) * 20
    
    # 2. ICD-10 Dynamic Weighting [INTEGRATED]
    if hasattr(patient, 'icd_code') and patient.icd_code:
        # Validate using simple_icd_10 library
        if icd.is_valid_item(patient.icd_code):
            chapter = patient.icd_code[0].upper()
            chapter_bonus = ICD_CHAPTER_WEIGHTS.get(chapter, 10)
            score += chapter_bonus
            
    # 3. Standard Symptom Bonuses (Fallback/Addition)
    symptoms_lower = [s.lower() for s in (patient.symptoms or [])]
    if any("chest pain" in s for s in symptoms_lower): score += 25
    if any("shortness of breath" in s for s in symptoms_lower): score += 20
    
    # 4. Anti-Starvation (Wait-Time Compensation)
    wait_time_mins = (datetime.utcnow() - patient.check_in_time).total_seconds() / 60
    score += (wait_time_mins // 2)
    
    return float(score)

# --- Updated API Endpoints ---

@app.get("/api/queue/icd-validate")
def validate_icd(code: str):
    """
    Bio-Intake Helper: Validates a code and returns the medical description.
    """
    is_valid = icd.is_valid_item(code)
    return {
        "valid": is_valid,
        "description": icd.get_description(code) if is_valid else "Unknown Medical Code",
        "chapter": code[0].upper() if is_valid else None
    }

@app.post("/api/queue/checkin")
async def queue_checkin(request: QueueCheckInRequest, db: Session = Depends(get_db)):
    """
    Enhanced Check-in: Now accepts ICD-10 codes from the nurse's bio-intake form.
    """
    new_id = str(uuid.uuid4())
    
    # Ensure the icd_code is part of your QueueCheckInRequest Pydantic model
    patient = models.PatientQueue(
        id=new_id,
        patient_name=request.patient_name,
        patient_age=request.patient_age,
        gender=request.gender,
        base_acuity=request.base_acuity,
        icd_code=request.icd_code, # [INTEGRATED]
        icd_rationale=request.icd_rationale,
        triage_urgency=request.triage_urgency,
        vitals=request.vitals,
        symptoms=request.symptoms,
        check_in_time=datetime.utcnow(),
        status="WAITING"
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Calculate initial score based on ICD-10 + ESI
    patient.priority_score = calculate_priority_index(patient)
    db.commit()
    
    await manager.broadcast({"type": "QUEUE_UPDATE"})
    return {"status": "success", "patient_id": new_id, "priority_score": patient.priority_score}

@app.post("/api/clinical/classify")
async def clinical_classify(request: dict):
    """
    Phrelis OS Clinical Intelligence Core: Map unstructured data to ICD-10.
    """
    complaint = request.get("complaint", "")
    symptoms = request.get("symptoms", [])
    if isinstance(symptoms, str):
        symptoms = [s.strip() for s in symptoms.split(",")]
    
    classification = await ai_agent.classify_icd(complaint, symptoms)
    return classification

@app.get("/api/queue/sorted")
def get_sorted_queue(db: Session = Depends(get_db)):
    """
    Real-time Orchestration Hub: Recalculates all scores to 
    account for growing wait times.
    """
    patients = db.query(models.PatientQueue).filter(models.PatientQueue.status == "WAITING").all()
    
    for p in patients:
        p.priority_score = calculate_priority_index(p)
    
    db.commit() 
    
    # Sort by Priority Score (Descending)
    sorted_patients = sorted(patients, key=lambda x: x.priority_score, reverse=True)
    
    # Surge Logic
    avg_score = sum(p.priority_score for p in sorted_patients) / len(sorted_patients) if sorted_patients else 0
    surge_warning = avg_score > 105 # Critical threshold

    return {
        "patients": sorted_patients,
        "surge_warning": surge_warning,
        "average_score": avg_score,
        "system_status": "CRITICAL" if surge_warning else "STABLE"
    }

# --- Internal ICD-10 Search Helper (For Demo) ---
@app.get("/api/queue/icd-search")
def search_icd_codes(query: str):
    """
    Simulated ICD-10 Lookup Service.
    In a real app, this would hit an external library or ICD-10 database.
    """
    # Example mock data
    mock_codes = [
        {"code": "I21.9", "desc": "Acute Myocardial Infarction (Heart Attack)"},
        {"code": "J44.9", "desc": "Chronic Obstructive Pulmonary Disease (COPD)"},
        {"code": "S06.0X1A", "desc": "Concussion, Initial Encounter"},
        {"code": "L03.90", "desc": "Cellulitis, Unspecified"}
    ]
    return [c for c in mock_codes if query.lower() in c['desc'].lower() or query.lower() in c['code'].lower()]




# def calculate_priority_index(patient: models.PatientQueue):
#     """
#     ESI Score: (6 - baseAcuity) * 20 points.
#     Symptom Weights: Bonus points for 'Chest Pain' (+25), 'Shortness of Breath' (+20), 'Fever' (+10).
#     Wait-Time Compensation: +1 point for every 2 minutes spent in the queue.
#     """
#     score = (6 - patient.base_acuity) * 20
    
#     # Symptom Bonuses
#     symptoms_lower = [s.lower() for s in (patient.symptoms or [])]
#     if any("chest pain" in s for s in symptoms_lower): score += 25
#     if any("shortness of breath" in s or "sob" in s for s in symptoms_lower): score += 20
#     if any("fever" in s for s in symptoms_lower): score += 10
    
#     # Wait Time Compensation
#     wait_time_mins = (datetime.utcnow() - patient.check_in_time).total_seconds() / 60
#     score += (wait_time_mins // 2)
    
#     return float(score)

# @app.post("/api/queue/checkin")
# async def queue_checkin(request: QueueCheckInRequest, db: Session = Depends(get_db)):
#     new_id = str(uuid.uuid4())
#     patient = models.PatientQueue(
#         id=new_id,
#         patient_name=request.patient_name,
#         patient_age=request.patient_age,
#         gender=request.gender,
#         base_acuity=request.base_acuity,
#         vitals=request.vitals,
#         symptoms=request.symptoms,
#         check_in_time=datetime.utcnow(),
#         status="WAITING"
#     )
#     db.add(patient)
#     db.commit()
#     db.refresh(patient)
    
#     # Calculate initial score
#     patient.priority_score = calculate_priority_index(patient)
#     db.commit()
    
#     await manager.broadcast({"type": "QUEUE_UPDATE"})
#     return {"status": "success", "patient_id": new_id}

# @app.get("/api/queue/sorted")
# def get_sorted_queue(db: Session = Depends(get_db)):
#     patients = db.query(models.PatientQueue).filter(models.PatientQueue.status == "WAITING").all()
    
#     # Recalculate scores on the fly for real-time wait-time compensation
#     for p in patients:
#         p.priority_score = calculate_priority_index(p)
    
#     db.commit() # Save updated scores
    
#     # Re-fetch sorted (or just sort in memory)
#     sorted_patients = sorted(patients, key=lambda x: x.priority_score, reverse=True)
    
#     # Add Surge Warning logic
#     avg_score = sum(p.priority_score for p in sorted_patients) / len(sorted_patients) if sorted_patients else 0
#     surge_warning = avg_score > 100 # Example threshold

#     return {
#         "patients": sorted_patients,
#         "surge_warning": surge_warning,
#         "average_score": avg_score
#     }

@app.get("/api/queue/rooms")
def get_doctor_rooms(db: Session = Depends(get_db)):
    return db.query(models.DoctorRoom).all()

@app.post("/api/queue/call/{patient_id}")
async def call_to_room(patient_id: str, room_id: str, db: Session = Depends(get_db)):
    patient = db.query(models.PatientQueue).filter(models.PatientQueue.id == patient_id).first()
    room = db.query(models.DoctorRoom).filter(models.DoctorRoom.id == room_id).first()
    
    if not patient or not room:
        raise HTTPException(404, "Patient or Room not found")
        
    if room.status == "ACTIVE":
        raise HTTPException(400, "Room is already active")

    # Update Patient Status
    patient.status = "CONSULTATION"
    patient.assigned_room = room_id
    
    # Update Room Status
    room.status = "ACTIVE"
    room.current_patient_id = patient_id
    
    db.commit()

    # [NEW] Log Consultation for Billing
    consult_price = BillingService.get_price(db, "Specialist") # Category CONSULTATION
    new_consult = models.ConsultationLog(
        patient_id=patient.id,
        patient_name=patient.patient_name,
        doctor_name=room.doctor_name,
        room_id=room.id,
        price_at_time=consult_price
    )
    db.add(new_consult)
    db.commit()
    
    # Trigger Inventory Hook for OPD Consumables
    await InventoryService.process_usage(
        db, manager, "OPD_Consultation", 
        {
            "patient_name": patient.patient_name, 
            "id": patient.id, 
            "condition": "OPD Consult",
            "admission_uid": None # OPD doesn't have ADM-UID yet
        }
    )
    
    await manager.broadcast({"type": "QUEUE_UPDATE"})
    await manager.broadcast({"type": "ROOM_UPDATE", "room_id": room_id, "status": "ACTIVE"})
    
    return {"status": "called"}

@app.post("/api/queue/complete/{room_id}")
async def complete_consultation(room_id: str, db: Session = Depends(get_db)):
    room = db.query(models.DoctorRoom).filter(models.DoctorRoom.id == room_id).first()
    if not room or room.status == "IDLE":
        raise HTTPException(400, "Invalid room or room already idle")
        
    patient_id = room.current_patient_id
    patient = db.query(models.PatientQueue).filter(models.PatientQueue.id == patient_id).first()
    
    if patient:
        patient.status = "COMPLETED"
        
    room.status = "IDLE"
    room.current_patient_id = None
    
    db.commit()
    
    await manager.broadcast({"type": "QUEUE_UPDATE"})
    await manager.broadcast({"type": "ROOM_UPDATE", "room_id": room_id, "status": "IDLE"})
    
    return {"status": "completed"}

@app.get("/api/external/capacity")
def get_external_capacity(db: Session = Depends(get_db)):
    """Anonymized bed availability and patient load data"""
    total_beds = db.query(models.BedModel).count()
    occupied_beds = db.query(models.BedModel).filter(models.BedModel.is_occupied == True).count()
    opd_waiting = db.query(models.PatientQueue).filter(models.PatientQueue.status == "WAITING").count()
    
    return {
        "hospital_name": "Phrelis General",
        "bed_capacity": total_beds,
        "beds_available": total_beds - occupied_beds,
        "opd_load": opd_waiting,
        "timestamp": datetime.utcnow()
    }

# --- Infrastructure ---

# [NEW] Inventory Endpoint
@app.get("/api/erp/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.InventoryItem).all()

@app.get("/api/inventory/forecast")
def get_inventory_forecast(db: Session = Depends(get_db)):
    """
    Predictive Engine: Calculates burn rate and exhaustion time.
    """
    # 1. Calculate Hospital Load Multiplier
    total_beds = db.query(models.BedModel).count() or 1
    occupied_beds = db.query(models.BedModel).filter(models.BedModel.is_occupied == True).count()
    occupancy_rate = occupied_beds / total_beds
    
    # Dynamic Weighting: Global 1.2x overhead if hospital is busy (>80%)
    load_multiplier = 1.2 if occupancy_rate > 0.8 else 1.0
    
    items = db.query(models.InventoryItem).all()
    forecast_data = []
    
    now = datetime.utcnow()
    six_hours_ago = now - timedelta(hours=6)
    
    for item in items:
        # 2. Historical Windowing (Last 6 Hours)
        logs = db.query(models.InventoryLog).filter(
            models.InventoryLog.item_id == item.id,
            models.InventoryLog.timestamp >= six_hours_ago
        ).all()
        
        total_used = sum(log.quantity_used for log in logs)
        
        # 3. Consumption Rate Calculation (Units per Hour)
        # Avoid division by zero, default to minimal usage to prevent infinite exhaustion time
        raw_burn_rate = total_used / 6.0
        if raw_burn_rate == 0: raw_burn_rate = 0.1 # Baseline trickle
            
        # Apply Logic: Dynamic Weighting
        adjusted_burn_rate = raw_burn_rate * load_multiplier
        
        # 4. Exhaustion Prediction
        hours_remaining = 999.0
        if adjusted_burn_rate > 0:
            hours_remaining = item.quantity / adjusted_burn_rate
            
        # 5. Smart Alert Thresholds
        status = "Normal"
        if hours_remaining < 3:
            status = "Critical" # Stockout Imminent
        elif hours_remaining < 12:
            status = "Warning" # Draft Reorder
            
        forecast_data.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "reorder_level": item.reorder_level,
            "burn_rate": round(adjusted_burn_rate, 2),
            "hours_remaining": round(hours_remaining, 1),
            "status": status,
            "load_multiplier": load_multiplier if occupancy_rate > 0.8 else 1.0 # For debugging/UI transparency
        })
        
    return forecast_data


@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    print("[DEBUG] get_dashboard_stats: Starting queries...")
    def get_count(unit_type: str):
        return db.query(models.BedModel).filter(
            models.BedModel.type == unit_type, 
           (models.BedModel.is_occupied == True) | (models.BedModel.status == "OCCUPIED")
        ).count()

    er_occ = get_count("ER")
    icu_occ = get_count("ICU")
    wards_occ = get_count("Wards")
    surgery_occ = get_count("Surgery")
    print("[DEBUG] get_dashboard_stats: Occupancy counts done.")
    
    total_beds = db.query(models.BedModel).count() or 190

    # Resource Usage
    vents_in_use = db.query(models.BedModel).filter(models.BedModel.ventilator_in_use == True).count()
    amb_total = db.query(models.Ambulance).count()
    amb_avail = db.query(models.Ambulance).filter(models.Ambulance.status == "IDLE").count()
    print("[DEBUG] get_dashboard_stats: Resource usage query done.")

    # Staff Ratio (Patients per Doctor)
    total_doctors = db.query(models.Staff).filter(models.Staff.role == "Doctor", models.Staff.is_clocked_in == True).count()
    total_patients = er_occ + icu_occ + wards_occ + surgery_occ
    
    ratio_str = "N/A"
    if total_doctors > 0:
        ratio = round(total_patients / total_doctors, 1)
        ratio_str = f"1:{ratio}"
    print("[DEBUG] get_dashboard_stats: Staff ratio done.")

    print("[DEBUG] get_dashboard_stats: Querying active patients...")
    patient_list = [
            {
                "admission_uid": adm.admission_uid,
                "patient_name": adm.patient_name,
                "bed_id": adm.bed_id,
                "status": adm.status
            }
            for adm in db.query(models.Admission).filter(models.Admission.status == "ACTIVE").limit(50).all()
        ]
    print(f"[DEBUG] get_dashboard_stats: Found {len(patient_list)} active patients.")

    return {
        "staff_ratio": ratio_str,
        "occupancy": {
            "ER": er_occ, 
            "ICU": icu_occ, 
            "Wards": wards_occ, 
            "Surgery": surgery_occ
        },
        "bed_stats": {
            "total": total_beds,
            "occupied": er_occ + icu_occ + wards_occ + surgery_occ,
            "available": total_beds - (er_occ + icu_occ + wards_occ + surgery_occ)
        },
        "resources": {
            "Ventilators": {"total": 20, "in_use": vents_in_use},
            "Ambulances": {"total": amb_total, "available": amb_avail}
        },
        "patients": patient_list
    }
# Ambulance System 

@app.get("/api/ambulances")
def list_ambulances(db: Session = Depends(get_db)):
    return db.query(models.Ambulance).all()

@app.post("/api/ambulance/dispatch")
def dispatch_ambulance(request: AmbulanceRequest, db: Session = Depends(get_db)):
    # 1. Check Hospital Capacity (Diversion Logic)
    required_type = "ICU" if request.severity.upper() == "HIGH" else "ER"
    
    total_beds = 20 if required_type == "ICU" else 60
    occupied = db.query(models.BedModel).filter(
        models.BedModel.type == required_type, 
        models.BedModel.is_occupied == True
    ).count()
    
    if occupied >= total_beds:
        return {
            "status": "DIVERTED", 
            "message": f"Hospital {required_type} Full. Ambulance Redirected to neighboring facility.",
            "ambulance_id": None
        }

    # 2. Find Available Ambulance
    ambulance = db.query(models.Ambulance).filter(models.Ambulance.status == "IDLE").first()
    
    if not ambulance:
        return {
            "status": "DELAYED", 
            "message": "No ambulances available at station.",
            "ambulance_id": None
        }

    # 3. Dispatch
    ambulance.status = "DISPATCHED"
    ambulance.location = request.location
    ambulance.eta_minutes = request.eta
    db.commit()
    
    return {
        "status": "DISPATCHED",
        "ambulance_id": ambulance.id,
        "eta": f"{request.eta} mins",
        "target_unit": required_type
    }

@app.post("/api/ambulance/reset/{ambulance_id}")
def reset_ambulance(ambulance_id: str, db: Session = Depends(get_db)):
    amb = db.query(models.Ambulance).filter(models.Ambulance.id == ambulance_id).first()
    if amb:
        amb.status = "IDLE"
        amb.location = "Station"
        amb.eta_minutes = 0
        db.commit()
        return {"status": "success", "message": f"Ambulance {ambulance_id} returned to station."}
    raise HTTPException(status_code=404, detail="Ambulance not found")

# Staff & Task Management 

@app.get("/api/staff")
def get_staff(db: Session = Depends(get_db)):

    total_nurses = db.query(models.Staff).filter(models.Staff.role == "Nurse", models.Staff.is_clocked_in == True).count()
    total_doctors = db.query(models.Staff).filter(models.Staff.role == "Doctor", models.Staff.is_clocked_in == True).count()
    
    staff_list = db.query(models.Staff).all()
    assignments = db.query(models.BedAssignment).filter(models.BedAssignment.is_active == True).all()
    
    return {
        "stats": {"nurses_on_shift": total_nurses, "doctors_on_shift": total_doctors},
        "staff": staff_list,
        "assignments": assignments
    }

@app.post("/api/staff/clock")
def clock_staff(request: StaffClockIn, db: Session = Depends(get_db)):
    staff = db.query(models.Staff).filter(models.Staff.id == request.staff_id).first()
    if not staff: raise HTTPException(status_code=404, detail="Staff not found")
    
    staff.is_clocked_in = not staff.is_clocked_in # Toggle
    db.commit()
    return {"status": "success", "is_clocked_in": staff.is_clocked_in}

@app.get("/api/staff/worklist/{staff_id}")
async def get_staff_worklist(staff_id: str, db: Session = Depends(get_db)):
    # 1. Find patients assigned to this specific nurse
    patients = db.query(models.PatientRecord).filter(
        models.PatientRecord.assigned_staff == staff_id,
        models.PatientRecord.discharge_time == None  
    ).all()
    
    # 2. Get ONLY PENDING tasks for those specific patients
    patient_ids = [p.id for p in patients]
    tasks = db.query(models.Task).filter(
        models.Task.patient_id.in_(patient_ids),
        models.Task.status == "Pending"  
    ).all()
    
    return {
        "patients": patients,
        "tasks": tasks,
        "stats": {
            "total_patients": len(patients),
            "pending_tasks": len(tasks)
        }
    }


@app.post("/api/staff/assign")
def assign_staff(request: StaffAssign, db: Session = Depends(get_db)):
    bed = db.query(models.BedModel).filter(models.BedModel.id == request.bed_id).first()
    patient = db.query(models.PatientRecord).filter(models.PatientRecord.patient_name == bed.patient_name).first()

    if not patient:
        raise HTTPException(status_code=404, detail="No active patient found in this bed.")
    
    patient.assigned_staff = request.staff_id
    
    if request.role == "Primary Nurse":

        current_load = db.query(models.BedAssignment).filter(
            models.BedAssignment.staff_id == request.staff_id,
            models.BedAssignment.is_active == True
        ).count()

        target_bed = db.query(models.BedModel).filter(models.BedModel.id == request.bed_id).first()
        is_critical = target_bed.type == "ICU" or (target_bed.condition and "Critical" in target_bed.condition)

        if is_critical and current_load >= 2: 
             raise HTTPException(status_code=400, detail="Load Limit Reached: Nurse has critical patient load.")
        if current_load >= 6:
             raise HTTPException(status_code=400, detail="Load Limit Reached: Max 6 patients per nurse.")


    existing = db.query(models.BedAssignment).filter(
        models.BedAssignment.bed_id == request.bed_id,
        models.BedAssignment.assignment_type == request.role,
        models.BedAssignment.is_active == True
    ).first()
    if existing:
        existing.is_active = False
        existing.end_time = datetime.utcnow()
    
    # 3. Create New Assignment
    new_assign = models.BedAssignment(
        bed_id=request.bed_id,
        staff_id=request.staff_id,
        assignment_type=request.role
    )
    db.add(new_assign)
    db.commit()
    return {"status": "assigned", "staff": request.staff_id, "bed": request.bed_id}

@app.get("/api/staff/dashboard/{staff_id}")
def staff_dashboard(staff_id: str, db: Session = Depends(get_db)):
    # "Digital Floor Plan" logic
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff: raise HTTPException(404, "Staff not found")
    
    # Get Assigned Beds
    assignments = db.query(models.BedAssignment).filter(
        models.BedAssignment.staff_id == staff_id,
        models.BedAssignment.is_active == True
    ).all()
    
    bed_ids = [a.bed_id for a in assignments]
    beds = db.query(models.BedModel).filter(models.BedModel.id.in_(bed_ids)).all()
    
    # Get Tasks for these beds
    tasks = db.query(models.Task).filter(
        models.Task.bed_id.in_(bed_ids),
        models.Task.status == "Pending"
    ).all()
    
    return {
        "role": staff.role,
        "my_beds": beds,
        "my_tasks": tasks
    }

def initialize_hospital_beds(db: Session):
    # Precise 190 Bed Distribution
    targets = [
        ("ICU", "ICU", 20), 
        ("ER", "ER", 60), 
        ("Surgery", "SURG", 10)
    ]
    
    # 1. Seed Static Units
    for unit, prefix, count in targets:
        for i in range(1, count + 1):
            bid = f"{prefix}-{i}"
            if not db.query(models.BedModel).filter(models.BedModel.id == bid).first():
                db.add(models.BedModel(id=bid, type=unit, billing_category=unit, gender="Any", is_occupied=False, status="AVAILABLE"))

    # 2. Seed 100 Ward Beds with Zone Distribution
    if db.query(models.BedModel).filter(models.BedModel.type == "Wards").count() == 0:
        # Medical Ward (40: 20M/20F)
        for i in range(1, 21):
            db.add(models.BedModel(id=f"WARD-MED-M-{i}", type="Wards", billing_category="Medical Ward", gender="M"))
            db.add(models.BedModel(id=f"WARD-MED-F-{i}", type="Wards", billing_category="Medical Ward", gender="F"))
        
        # Specialty (30: 15 Ped / 15 Mat)
        for i in range(1, 16):
            db.add(models.BedModel(id=f"WARD-PED-{i}", type="Wards", billing_category="Pediatric", gender="Any"))
            db.add(models.BedModel(id=f"WARD-MAT-{i}", type="Wards", billing_category="Maternity", gender="F"))
            
        # Recovery & Security (30)
        for i in range(1, 11):
            db.add(models.BedModel(id=f"WARD-HDU-{i}", type="Wards", billing_category="HDU", gender="Any"))
            db.add(models.BedModel(id=f"WARD-DC-{i}", type="Wards", billing_category="Day Care", gender="Any"))
        for i in range(1, 6):
            db.add(models.BedModel(id=f"WARD-ISO-{i}", type="Wards", billing_category="Isolation", gender="Any"))
            db.add(models.BedModel(id=f"WARD-SEMIP-{i}", type="Wards", billing_category="Semi-Private", gender="Any"))
    
    db.commit()

@app.on_event("startup")
def seed_db():
    db = next(get_db())
    initialize_hospital_beds(db)
    
    # Seed Ambulances
    if db.query(models.Ambulance).count() == 0:
        ambs = []
        for i in range(1, 6): # 5 Ambulances
            ambs.append(models.Ambulance(id=f"AMB-0{i}", status="IDLE", location="Station", eta_minutes=0))
        db.add_all(ambs)
        db.commit()

    # Seed Staff
    if db.query(models.Staff).count() == 0:
        staff_members = []
        
        # Admin
        staff_members.append(models.Staff(id="A-01", name="System Admin", role="Admin", is_clocked_in=True, hashed_password="adminpassword"))
        
        # 10 Doctors (D-01 to D-10)
        doctor_names = [
            "Dr. House", "Dr. Strange", "Dr. Quinn", "Dr. Watson", "Dr. Grey",
            "Dr. Shepherd", "Dr. Dorian", "Dr. Cox", "Dr. Wilson", "Dr. Zhivago"
        ]
        for i in range(10):
            staff_members.append(models.Staff(
                id=f"D-{str(i+1).zfill(2)}",
                name=doctor_names[i],
                role="Doctor",
                is_clocked_in=(i % 2 == 0), # Half clocked in
                hashed_password="password123"
            ))
            
        # 20 Nurses (N-01 to N-20)
        nurse_names = [
            "Nurse Jackie", "Nurse Ratched", "Nurse Joy", "Nurse Carol", "Nurse Abby",
            "Nurse Sam", "Nurse Haleh", "Nurse Chuny", "Nurse Malik", "Nurse Lily",
            "Nurse Rose", "Nurse Daisy", "Nurse Violet", "Nurse Iris", "Nurse Flora",
            "Nurse Skye", "Nurse River", "Nurse Willow", "Nurse Autumn", "Nurse Summer"
        ]
        for i in range(20):
            staff_members.append(models.Staff(
                id=f"N-{str(i+1).zfill(2)}",
                name=nurse_names[i],
                role="Nurse",
                is_clocked_in=(i < 12), # 60% clocked in
                hashed_password="password123"
            ))
            
        db.add_all(staff_members)
        db.commit()
    

# class WeatherService:
#     @staticmethod
#     async def get_weather_coefficient() -> dict:
#         hour = datetime.now().hour
#         temp, humidity, condition = 20, 50, "Clear"
#         if hour < 8: temp, condition = -2, "Snow"
#         elif 12 < hour < 16: temp, humidity = 35, 95
#         multiplier, reason = 1.0, "Normal Conditions"
#         if temp < 0: multiplier, reason = 1.15, f"Cold Snap ({temp}°C)"
        
#         return {
#             "temp": temp, "humidity": humidity, "condition": condition,
#             "multiplier": multiplier, "reason": reason
#         }

# @app.post("/api/predict-inflow")
# async def predict_inflow(db: Session = Depends(get_db)):
#     """
#     Deterministic Neural Engine Logic: 
#     Strict mathematical bimodal forecast.
#     """
#     weather = await WeatherService.get_weather_coefficient()
#     w_mult = weather["multiplier"] 
    
#     occupied_count = db.query(models.BedModel).filter(models.BedModel.is_occupied == True).count()
#     # Saturation factor based on real-time bed data
#     saturation_factor = 1 + (occupied_count / 60) * 0.25 

#     current_hour = datetime.now().hour
#     forecast = []
#     total_val = 0
    
#     # Generate 12-hour deterministic forecast
#     for i in range(1, 13):
#         h = (current_hour + i) % 24
        

#         morning_peak = 18 * math.exp(-((h - 10)**2) / 6) 
#         evening_peak = 14 * math.exp(-((h - 20)**2) / 5)
        
 
#         base_inflow = 4 + morning_peak + evening_peak
        
#         predicted_count = int(base_inflow * w_mult * saturation_factor)
#         forecast.append({"hour": f"{h}:00", "inflow": predicted_count})
#         total_val += predicted_count
    
#     peak_entry = max(forecast, key=lambda x: x["inflow"])
#     return {
#         "forecast": forecast,
#         "total_predicted_inflow": total_val,
#         "risk_level": "HIGH SURGE RISK" if total_val > 50 else "STABLE",
#         "weather_impact": weather,
#         "confidence_score": 95, 
#         "factors": {
#         "environmental": f"{round(w_mult, 2)}x",
#         "systemic_saturation": f"{round(saturation_factor, 2)}x"
#         }
#     }



class InflowRequest(BaseModel):
    weather_event_multiplier: bool = False
    sim_intensity: float = 1.5  # Sync with frontend default

class WeatherService:
    @staticmethod
    def calculate_heat_index(temp: float, humidity: float) -> float:
        e = (humidity / 100) * 6.105 * math.exp((17.27 * temp) / (237.7 + temp))
        return temp + 0.33 * e - 4.0

    @staticmethod
    def get_aqi_multiplier(aqi_value: float) -> tuple:
        """
        Calculates impact based on US EPA AQI scale.
        Impacts respiratory (asthma/COPD) and cardiac admissions.
        """
        if aqi_value > 300: # Hazardous
            return 1.45, f"Hazardous AQI ({round(aqi_value)})"
        elif aqi_value > 200: # Very Unhealthy
            return 1.30, f"Very Unhealthy Air Quality"
        elif aqi_value > 150: # Unhealthy
            return 1.20, f"Unhealthy AQI Spike"
        elif aqi_value > 100: # Unhealthy for Sensitive Groups
            return 1.10, f"Sensitive Groups AQI Alert"
        return 1.0, "Good/Moderate Air"

    @staticmethod
    def get_multiplier_logic(feels_like: float, rain_mm: float, humidity: float, aqi: float = 0) -> tuple:
        beta, threshold = 0.04, 35.0
        
        # Calculate individual multipliers
        aqi_mult, aqi_reason = WeatherService.get_aqi_multiplier(aqi)
        
        # Primary Weather Logic
        if feels_like > threshold:
            w_mult = math.exp(beta * (feels_like - threshold))
            w_reason = f"Exp. Heat Stress ({round(feels_like)}°C)"
        elif rain_mm > 0.1:
            if rain_mm >= 10: 
                w_mult, w_reason = 1.60, "Severe Monsoon (Flood/Trauma)"
            elif 2 < rain_mm < 10: 
                w_mult, w_reason = 1.35, "Standard Monsoon Surge"
            else: 
                w_mult, w_reason = 1.15, "Light Rain / Humidity"
        elif humidity > 85:
            w_mult, w_reason = 1.10, "High Humidity Alert"
        else:
            w_mult, w_reason = 1.0, "Optimal Conditions"
            
        # Combine Multipliers (Compounding Impact)
        # We take the higher impact or a weighted average. Here we take the max to identify the primary driver.
        if w_mult > 1.0 and aqi_mult > 1.0:
        # Formula: Take the biggest impact + 50% of the smaller impact's extra weight
        # This reflects how Heat + Pollution is deadlier than just one alone.
            final_mult = max(w_mult, aqi_mult) + (min(w_mult, aqi_mult) - 1.0) * 0.5
            final_reason = f"{w_reason} + {aqi_reason}"
        else:
        # If only one factor is active, or conditions are optimal, just take the max
            final_mult = max(w_mult, aqi_mult)
            final_reason = aqi_reason if aqi_mult > w_mult else w_reason
            
        return round(final_mult, 2), final_reason

    @staticmethod
    async def get_hourly_environmental_data() -> dict:
        lat, lon = 19.0760, 72.8777 
        # API 1: Standard Weather
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,precipitation&forecast_days=2"
        # API 2: Air Quality (US AQI Index)
        aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=us_aqi&forecast_days=2"
        
        try:
            async with httpx.AsyncClient() as client:
                w_res = await client.get(weather_url)
                a_res = await client.get(aqi_url)
                
                data = w_res.json()["hourly"]
                data["us_aqi"] = a_res.json()["hourly"]["us_aqi"]
                return data
        except Exception as e:
            print(f"Environmental API Error: {e}")
            return None

@app.post("/api/predict-inflow")
async def predict_inflow(req: InflowRequest, db: Session = Depends(get_db)):
    hourly_data = await WeatherService.get_hourly_environmental_data()
    
    # Systemic Saturation Logic
    occupied_count = db.query(models.BedModel).filter(models.BedModel.is_occupied == True).count()
    saturation_factor = 1 + (occupied_count / 60) * 0.25 

    now = datetime.now()
    forecast, total_val, current_snap = [], 0, {}
    
    is_sim = req.weather_event_multiplier
    sim_intensity = req.sim_intensity 
    start_hour = now.hour

    for i in range(0, 12):
        future_time = now + timedelta(hours=i)
        idx = start_hour + i
        
        if hourly_data and idx < len(hourly_data["temperature_2m"]):
            temp = hourly_data["temperature_2m"][idx]
            hum = hourly_data["relative_humidity_2m"][idx]
            rain = hourly_data["precipitation"][idx]
            aqi = hourly_data["us_aqi"][idx] # New AQI field
            fl = WeatherService.calculate_heat_index(temp, hum)
            w_mult, w_reason = WeatherService.get_multiplier_logic(fl, rain, hum, aqi)
        else:
            temp, hum, rain, aqi, fl, w_mult, w_reason = 27, 50, 0, 50, 27, 1.0, "Telemetry Offline"

        # Apply Sim vs Real
        final_mult = sim_intensity if is_sim else w_mult
        final_reason = f"SIMULATION: {sim_intensity}x Spike" if is_sim else w_reason

        if i == 0:
            current_snap = {
                "temp": temp, "humidity": hum, "rain_mm": rain, "aqi": aqi,
                "feels_like": round(fl, 1), "multiplier": final_mult, "reason": final_reason
            }

        # XGBoost prediction core
        base_prediction = ai_brain.predict(pd.DataFrame([{
            "hour": future_time.hour, 
            "day_of_week": future_time.weekday(), 
            "month": future_time.month
        }]))[0]
        
        predicted_count = int(base_prediction * final_mult * saturation_factor)
        
        forecast.append({
            "hour": future_time.strftime("%H:00"), 
            "inflow": max(0, predicted_count),
            "temp": temp, "rain": rain, "aqi": aqi,
            "multiplier": final_mult, "reason": final_reason
        })
        total_val += predicted_count
    
    return {
        "engine": "XGBoost + Env-Multivariate",
        "forecast": forecast,
        "total_predicted_inflow": total_val,
        "risk_level": "CRITICAL" if total_val > 100 else "HIGH SURGE" if total_val > 80 else "STABLE",
        "weather_impact": current_snap,
        "factors": {
            "environmental": f"Simulated ({sim_intensity}x)" if is_sim else "AQI + Weather Tracking",
            "systemic_saturation": f"{round(saturation_factor, 2)}x"
        }
    }

# --- Sentinel Flow Endpoints ---

@app.post("/api/events")
def log_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = models.Event(
        patient_id=event.patient_id,
        event_type=event.event_type,
        details=event.details,
        timestamp=datetime.utcnow()
    )
    db.add(new_event)
    db.commit()
    return {"status": "success", "event_id": new_event.id}

@app.get("/api/metrics/latency")
def get_latency_metrics(db: Session = Depends(get_db)):
    # Calculate average time between TRANSFER_START and TRANSFER_COMPLETE in last 24h
    completed_transfers = db.query(models.Event).filter(
        models.Event.event_type == "TRANSFER_COMPLETE"
    ).order_by(models.Event.timestamp.desc()).limit(100).all()
    
    total_latency = 0
    count = 0
    
    for end_event in completed_transfers:
        # Find corresponding start event
        start_event = db.query(models.Event).filter(
            models.Event.patient_id == end_event.patient_id,
            models.Event.event_type == "TRANSFER_START",
            models.Event.timestamp < end_event.timestamp
        ).order_by(models.Event.timestamp.desc()).first()
        
        if start_event:
            delta = (end_event.timestamp - start_event.timestamp).total_seconds() / 60 # minutes
            total_latency += delta
            count += 1
            
    avg_latency = total_latency / count if count > 0 else 0
    throughput = count 
    latency_score = min(avg_latency * 2, 100) 
    
    return {
        "latencyScore": latency_score,
        "averageLatencyMinutes": avg_latency,
        "throughputRate": throughput,
        "isCritical": latency_score > 80 
    }

@app.get("/api/predictions")
def get_predictions(db: Session = Depends(get_db)):
    return db.query(models.PredictionLog).order_by(models.PredictionLog.timestamp.desc()).limit(10).all()

@app.post("/api/predictions")
def create_prediction(pred: PredictionCreate, db: Session = Depends(get_db)):
    new_pred = models.PredictionLog(
        prediction_text=pred.prediction_text,
        target_department=pred.target_department,
        predicted_delay_minutes=pred.predicted_delay_minutes,
        timestamp=datetime.utcnow()
    )
    db.add(new_pred)
    db.commit()
    return {"status": "success"}

def calculate_latency_score(db: Session):
    completed_transfers = db.query(models.Event).filter(
        models.Event.event_type == "TRANSFER_COMPLETE"
    ).order_by(models.Event.timestamp.desc()).limit(20).all()
    
    if not completed_transfers: return 0
    
    total_latency = 0
    count = 0
    for end_event in completed_transfers:
        start_event = db.query(models.Event).filter(
            models.Event.patient_id == end_event.patient_id,
            models.Event.event_type == "TRANSFER_START",
            models.Event.timestamp < end_event.timestamp
        ).order_by(models.Event.timestamp.desc()).first()
        if start_event:
            delta = (end_event.timestamp - start_event.timestamp).total_seconds() / 60
            total_latency += delta
            count += 1
            
    avg = total_latency / count if count > 0 else 0
    return min(avg * 2, 100)

@app.get("/api/alerts/active")
def get_active_alerts(db: Session = Depends(get_db)):
    alerts = []
    
    
    latency = calculate_latency_score(db)
    if latency > 80:
        alerts.append({
            "type": "FLOW_OBSTRUCTION", 
            "message": "Latency threshold exceeded (Code Yellow).", 
            "level": "Critical"
        })
    elif latency > 50:
        alerts.append({
            "type": "FLOW_WARNING", 
            "message": "Transfer times degrading.", 
            "level": "High"
        })
        
    return {"alerts": alerts}

# --- FINANCIAL API ENDPOINTS ---

@app.get("/api/finance/bill/{admission_uid}")
async def get_bill(
    admission_uid: str, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin)  # [RBAC] Only Admin can view bills
):
    bill = db.query(models.Bill).filter(models.Bill.admission_uid == admission_uid).first()
    if not bill:
        # Check if admission exists and generate preview
        adm = db.query(models.Admission).filter(models.Admission.admission_uid == admission_uid).first()
        if not adm:
            raise HTTPException(404, "Admission not found")
        
        # Simple Estimate:
        days = BillingService.calculate_bed_days(adm.admission_time, datetime.utcnow())
        bed = db.query(models.BedModel).filter(models.BedModel.id == adm.bed_id).first()
        bed_cat = bed.billing_category if bed else "Ward"
        bed_price_item = db.query(models.PriceMaster).filter_by(name=bed_cat).first()
        bed_price = bed_price_item.price if bed_price_item else 3000.0
        
        bed_total = days * bed_price
        
        # Surgeries so far
        surgeries = db.query(models.SurgeryLog).filter_by(admission_uid=admission_uid).all()
        surg_total = sum((s.price_at_time or 0.0) for s in surgeries)

        # [NEW] Resources so far
        consumables = db.query(models.InventoryLog).filter_by(admission_uid=admission_uid).all()
        cons_total = 0.0
        cons_tax = 0.0
        for log in consumables:
            # Defensive check for item existence
            inv_item_query = db.query(models.InventoryItem).filter(models.InventoryItem.id == log.item_id).first()
            if not inv_item_query:
                continue
                
            # Join with PriceMaster for latest price
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
        
        # [NEW] Consultations so far
        consult_total = db.query(func.sum(models.ConsultationLog.price_at_time)).filter_by(patient_id=adm.patient_id, bill_no=None).scalar() or 0.0

        # [NEW] Detailed Itemization for Estimate
        estimate_items = []
        
        # 1. Bed charges
        estimate_items.append({
            "description": f"Bed Utilization ({bed_cat}) - {days} Days",
            "quantity": days,
            "unit_price": bed_price,
            "total_price": bed_total,
            "tax_percent": 0.0,
            "tax_amount": 0.0
        })

        # 2. Surgeries
        for s in surgeries:
            estimate_items.append({
                "description": f"Surgery - {s.surgery_name}",
                "quantity": 1,
                "unit_price": s.price_at_time,
                "total_price": s.price_at_time,
                "tax_percent": 0.0,
                "tax_amount": 0.0
            })

        # 3. Consumables
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
                
                estimate_items.append({
                    "description": f"Resource - {inv_item_query.name}",
                    "quantity": qty,
                    "unit_price": price,
                    "total_price": line_total,
                    "tax_percent": tax_rate,
                    "tax_amount": line_tax
                })

        # 4. Consultations
        consultations = db.query(models.ConsultationLog).filter_by(patient_id=adm.patient_id, bill_no=None).all()
        for c in consultations:
            estimate_items.append({
                "description": f"Consultation - Dr. {c.doctor_name or 'Staff'} ({c.room_id or 'OPD'})",
                "quantity": 1,
                "unit_price": c.price_at_time,
                "total_price": c.price_at_time,
                "tax_percent": 0.0,
                "tax_amount": 0.0
            })

        grand_total = bed_total + surg_total + cons_total + cons_tax + consult_total
        
        return {
            "status": "ESTIMATE",
            "admission_uid": admission_uid,
            "patient_name": adm.patient_name,
            "bed_days": days,
            "bed_charge": bed_total,
            "surgery_charge": surg_total,
            "resource_charge": cons_total,
            "consultation_charge": consult_total,
            "tax_amount": cons_tax,
            "grand_total": (grand_total or 0.0),
            "total": (grand_total or 0.0), # Legacy support
            "items": estimate_items
        }
    
    # Return actual bill items
    items = db.query(models.BillItem).filter(models.BillItem.bill_no == bill.bill_no).all()
    
    # Fetch patient name for final record
    adm_name = db.query(models.Admission.patient_name).filter_by(admission_uid=bill.admission_uid).scalar() or "Unknown"

    return {
        "status": "FINAL",
        "bill_no": bill.bill_no,
        "admission_uid": bill.admission_uid,
        "patient_name": adm_name,
        "total_amount": bill.total_amount,
        "tax_amount": bill.tax_amount,
        "grand_total": bill.grand_total,
        "total": bill.grand_total, # Legacy support
        "is_paid": bill.is_paid,
        "generated_at": bill.generated_at,
        "items": items
    }

@app.get("/api/finance/ledger")
def get_finance_ledger(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    current_user: CurrentUser = Depends(require_admin)  # [RBAC]
):
    query = db.query(models.Bill)
    
    if search:
        # Search by Bill No or Admission UID
        query = query.filter(
            (models.Bill.bill_no.ilike(f"%{search}%")) |
            (models.Bill.admission_uid.ilike(f"%{search}%"))
        )
    
    total = query.count()
    bills = query.order_by(models.Bill.generated_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for b in bills:
        # Fetch patient name from Admission or PatientQueue/ConsultationLog fallback
        adm_name = db.query(models.Admission.patient_name).filter_by(admission_uid=b.admission_uid).scalar()
        if not adm_name:
             # Try to find in PatientQueue via consultation search
             # (This is more complex, but we can stick to Admission for now or fallback to "Unknown")
             adm_name = "Unknown / OPD"
             
        data.append({
            "bill_no": b.bill_no,
            "admission_uid": b.admission_uid,
            "patient_name": adm_name,
            "amount": b.grand_total,
            "status": "PAID" if b.is_paid else "PENDING",
            "time": b.generated_at.isoformat()
        })
        
    return {
        "transactions": data,
        "total": total,
        "page": page,
        "total_pages": math.ceil(total / limit)
    }

@app.get("/api/finance/revenue/analytics")
async def get_revenue_analytics(
    timeframe: str = "24h", 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin)  # [RBAC] Only Admin can view revenue analytics
):
    """
    Aggregate Revenue Data.
    Timeframes: 24h, 7D, 1M, 1Y.
    """
    now = datetime.utcnow()
    start_time = now - timedelta(hours=24)
    
    if timeframe == "7D": start_time = now - timedelta(days=7)
    if timeframe == "1M": start_time = now - timedelta(days=30)
    if timeframe == "1Y": start_time = now - timedelta(days=365)
    
    # 1. Total Revenue in Period (Based on Bill Generation Time)
    bills = db.query(models.Bill).filter(models.Bill.generated_at >= start_time).all()
    total_revenue = sum(b.grand_total or 0.0 for b in bills)
    
    # 2. Revenue Trend (Chronological Line Graph)
    trend_buckets = []
    
    if timeframe == "24h":
        # Last 24 hours, hourly buckets
        for i in range(23, -1, -1):
            t = now - timedelta(hours=i)
            bucket_time = t.replace(minute=0, second=0, microsecond=0)
            trend_buckets.append({
                "timestamp": bucket_time,
                "label": bucket_time.strftime("%H:00"),
                "revenue": 0.0
            })
    else:
        # Daily buckets
        days = 7 if timeframe == "7D" else 30
        if timeframe == "1Y": days = 365
        for i in range(days-1, -1, -1):
            t = now - timedelta(days=i)
            bucket_time = t.replace(hour=0, minute=0, second=0, microsecond=0)
            trend_buckets.append({
                "timestamp": bucket_time,
                "label": bucket_time.strftime("%Y-%m-%d"),
                "revenue": 0.0
            })

    for bill in bills:
        # Find the bucket for this bill
        b_time = bill.generated_at
        for bucket in trend_buckets:
            if timeframe == "24h":
                if b_time.hour == bucket["timestamp"].hour and b_time.date() == bucket["timestamp"].date():
                    bucket["revenue"] += (bill.grand_total or 0.0)
                    break 
            else:
                if b_time.date() == bucket["timestamp"].date():
                    bucket["revenue"] += (bill.grand_total or 0.0)
                    break
        
    trend_data = [{"time": b["label"], "revenue": b["revenue"]} for b in trend_buckets]

    # 3. Revenue by Category (Bed vs Surgery vs Pharmacy)
    bed_revenue = 0.0
    surgery_revenue = 0.0
    pharmacy_revenue = 0.0
    consultation_revenue = 0.0
    total_tax = sum(b.tax_amount or 0.0 for b in bills)
    
    # Get all bills IDs first
    bill_ids = [b.bill_no for b in bills]
    if bill_ids:
        items = db.query(models.BillItem).filter(models.BillItem.bill_no.in_(bill_ids)).all()
        for i in items:
            price = i.total_price or 0.0
            desc = i.description or ""
            if "Bed" in desc:
                bed_revenue += price 
            elif "Surgery" in desc:
                surgery_revenue += price
            elif "Resource" in desc:
                pharmacy_revenue += price
            elif "Consultation" in desc:
                consultation_revenue += price
    
    # 4. Growth Calculation (v Previous Period)
    prev_start_time = start_time - (now - start_time)
    prev_bills = db.query(models.Bill).filter(
        models.Bill.generated_at >= prev_start_time,
        models.Bill.generated_at < start_time
    ).all()
    prev_revenue = sum(b.grand_total or 0.0 for b in prev_bills)
    growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else (100.0 if total_revenue > 0 else 0.0)

    # 5. Active Estimates Sum (Potential Revenue)
    active_admissions = db.query(models.Admission).filter_by(status="ACTIVE").all()
    # For a high-performance analytics endpoint, we might want to approximate here
    # rather than running calculate_bed_days for everyone, but let's be accurate for now
    potential_revenue = 0.0
    for adm in active_admissions:
        days = BillingService.calculate_bed_days(adm.admission_time, now)
        bed = db.query(models.BedModel).filter_by(id=adm.bed_id).first()
        bed_price = 3000.0 # Default
        if bed:
            bp_item = db.query(models.PriceMaster).filter_by(name=bed.billing_category or "Ward").first()
            if bp_item: bed_price = bp_item.price
        
        potential_revenue += (days * bed_price)
        # Add surgeries already logged
        s_total = db.query(func.sum(models.SurgeryLog.price_at_time)).filter_by(admission_uid=adm.admission_uid).scalar() or 0.0
        potential_revenue += s_total
        # [NEW] Add unbilled consultations
        c_total = db.query(func.sum(models.ConsultationLog.price_at_time)).filter_by(patient_id=adm.patient_id, bill_no=None).scalar() or 0.0
        potential_revenue += c_total

    # 6. KPI: ARPP (Average Revenue Per Patient)
    unique_patients = len(set(b.admission_uid for b in bills))
    arpp = total_revenue / unique_patients if unique_patients > 0 else 0.0
    
    # 7. KPI: Occupancy Rate (Current snapshot)
    total_beds = db.query(models.BedModel).count()
    occupied_beds = db.query(models.BedModel).filter_by(is_occupied=True).count()
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0.0
    
    # 8. Recent Activities (Last 20 Bills)
    recent_bills = db.query(models.Bill).order_by(models.Bill.generated_at.desc()).limit(20).all()
    recent_data = []
    for rb in recent_bills:
        adm_name = db.query(models.Admission.patient_name).filter_by(admission_uid=rb.admission_uid).scalar() or "Unknown / OPD"
        recent_data.append({
            "bill_no": rb.bill_no,
            "patient_name": adm_name,
            "amount": rb.grand_total,
            "status": "PAID" if rb.is_paid else "PENDING",
            "time": rb.generated_at.isoformat()
        })

    return {
        "kpi": {
            "total_revenue": total_revenue,
            "arpp": arpp,
            "occupancy_rate": occupancy_rate,
            "growth": growth,
            "potential_revenue": potential_revenue,
            "total_tax": total_tax
        },
        "breakdown": {
            "bed_revenue": bed_revenue,
            "surgery_revenue": surgery_revenue,
            "pharmacy_revenue": pharmacy_revenue,
            "consultation_revenue": consultation_revenue
        },
        "trend": trend_data,
        "recent": recent_data
    }


BILL_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { 
            size: A4; 
            margin: 0.5cm; 
        }
        body { 
            font-family: Helvetica, sans-serif; 
            color: #0f172a; 
            font-size: 9pt; 
            line-height: 1.2;
        }
        
        /* Header Section - Tightened */
        .header-table { width: 100%; border-bottom: 1.5pt solid #000; padding-bottom: 5pt; margin-bottom: 10pt; }
        .hospital-name { font-size: 18pt; font-weight: 900; letter-spacing: -0.5pt; color: #0f172a; }
        .hospital-sub { font-size: 7pt; font-weight: bold; color: #64748b; letter-spacing: 0.5pt; }
        .address-box { text-align: right; font-size: 6.5pt; font-weight: bold; color: #334155; }

        /* Invoice Title Section */
        .title-table { width: 100%; margin-bottom: 10pt; }
        .main-title { font-size: 28pt; font-weight: 900; font-style: italic; color: #0f172a; }
        .invoice-meta { font-size: 8pt; font-weight: bold; color: #94a3b8; }
        .status-badge { 
            background-color: #fef9c3; color: #854d0e; border: 0.5pt solid #fef08a;
            padding: 5pt 10pt; font-size: 8pt; font-weight: 900; text-align: center;
        }

        /* Patient Info Card - Compact */
        .info-card { background-color: #f8fafc; padding: 12pt 15pt; margin-bottom: 15pt; border-radius: 8pt; }
        .card-label { font-size: 7pt; font-weight: 900; color: #94a3b8; letter-spacing: 0.5pt; text-transform: uppercase; }
        .patient-name { font-size: 18pt; font-weight: 900; color: #0f172a; margin: 2pt 0; }
        .uid-text { font-family: monospace; font-size: 8.5pt; font-weight: bold; color: #475569; }

        /* Items Table - Optimized for Single Page */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
        .items-table th { 
            background-color: #0f172a; color: #ffffff; padding: 8pt; 
            font-size: 8pt; font-weight: 900; text-align: left; text-transform: uppercase;
        }
        .items-table td { padding: 8pt; border-bottom: 1pt solid #f1f5f9; font-size: 9pt; font-weight: bold; font-style: italic; }
        .sub-text { font-size: 6.5pt; color: #94a3b8; font-style: normal; font-weight: bold; display: block; }

        /* Summary Card - Fixed to Right */
        .summary-wrapper { width: 100%; }
        .summary-card { background-color: #f1f5f9; padding: 12pt; width: 40%; margin-left: 60%; border-radius: 10pt; }
        .summary-label { font-size: 8pt; font-weight: 900; color: #64748b; text-transform: uppercase; }
        .summary-value { font-size: 10pt; font-weight: 900; text-align: right; }
        .total-row { border-top: 1pt solid #cbd5e1; margin-top: 8pt; padding-top: 8pt; }
        .total-label { font-size: 18pt; font-weight: 900; color: #0f172a; }
        .total-value { font-size: 22pt; font-weight: 900; color: #0891b2; font-style: italic; text-align: right; }

        /* Footer - Simplified */
        .footer-table { width: 100%; margin-top: 30pt; }
        .terms { font-size: 6.5pt; font-weight: 900; color: #94a3b8; line-height: 1.4; text-transform: uppercase; }
        .signatory { border-top: 1.5pt solid #0f172a; padding-top: 5pt; text-align: center; width: 160pt; margin-left: auto; }
        .sign-text { font-size: 9pt; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .sign-sub { font-size: 7pt; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
        .hash-tag { text-align: center; font-size: 7pt; color: #cbd5e1; letter-spacing: 2pt; margin-top: 20pt; font-family: monospace; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="hospital-name">PHRELIS MULTISPECIALTY</div>
                <div class="hospital-sub">MEDICAL EXCELLENCE & DIGITAL HUB</div>
            </td>
            <td class="address-box">
                PLOT 42, HEALTH CITY, SECTOR 18<br/>NEW DELHI, DELHI 110025<br/>
                GSTIN: 07AABCP1234F1Z5 | +91 11 4567 8900
            </td>
        </tr>
    </table>

    <table class="title-table">
        <tr>
            <td>
                <div class="main-title">TAX INVOICE</div>
                <div class="invoice-meta">INV: <b>{{ bill_no }}</b> &nbsp;&nbsp;•&nbsp;&nbsp; DATE: <b>{{ date_str }}</b></div>
            </td>
            <td align="right" valign="middle">
                <div class="status-badge">PRE-SETTLEMENT DRAFT</div>
            </td>
        </tr>
    </table>

    <div class="info-card">
        <table width="100%">
            <tr>
                <td width="60%">
                    <div class="card-label">Patient Information</div>
                    <div class="patient-name">{{ patient_name }}</div>
                    <div class="uid-text">UID: {{ admission_uid }}</div>
                </td>
                <td width="40%" align="right">
                    <div class="card-label">Reference</div>
                    <div style="font-size: 8pt; font-weight: 900; line-height: 1.3;">
                        FACILITY: HUB DELTA-1 / WARD 4B<br/>
                        AUTH: SYS-ADMIN-PROX
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th width="65%">Service/Resource Description</th>
                <th width="10%" align="center">Qty</th>
                <th width="10%" align="center">GST</th>
                <th width="15%" align="right">Total (₹)</th>
            </tr>
        </thead>
        <tbody>
            {% for item in items %}
            <tr>
                <td>
                    {{ item.description }}
                    <span class="sub-text">Digital Validation Applied</span>
                </td>
                <td align="center">{{ item.quantity }}</td>
                <td align="center">{{ item.tax_percent }}%</td>
                <td align="right">₹{{ "{:,.0f}".format(item.total_price) }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="summary-card">
        <table width="100%">
            <tr>
                <td class="summary-label">Net Value</td>
                <td class="summary-value">₹{{"{:,.0f}".format(base_amount)}}</td>
            </tr>
            <tr>
                <td class="summary-label">Tax Aggregate</td>
                <td class="summary-value">₹{{"{:,.0f}".format(tax_amount)}}</td>
            </tr>
            <tr>
                <td colspan="2" class="total-row">
                    <table width="100%">
                        <tr>
                            <td class="total-label">TOTAL</td>
                            <td class="total-value">₹{{"{:,.0f}".format(total_amount)}}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer-table">
        <table width="100%">
            <tr>
                <td width="60%" valign="bottom">
                    <div class="terms">
                        1. Computer-generated invoice. No signature required.<br/>
                        2. Report discrepancies within 24 hours.<br/>
                        3. All disputes subject to New Delhi Jurisdictions.
                    </div>
                </td>
                <td width="40%">
                    <div class="signatory">
                        <div class="sign-text">Authorized Signatory</div>
                        <div class="sign-sub">Phrelis Financial Operations</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="hash-tag">
        SECURE-HASH: {{ admission_uid }}-{{ timestamp }}
    </div>
</body>
</html>
"""

@app.get("/api/finance/print/{bill_no}")
async def generate_bill_pdf(bill_no: str, db: Session = Depends(get_db)):
    bill_record = db.query(models.Bill).filter(models.Bill.bill_no == bill_no).first()
    if not bill_record: raise HTTPException(404, "Bill not found")

    # Important: Format date in Python to avoid "Invalid Date" in template
    formatted_date = datetime.now().strftime("%d %b %Y").upper() 
    
    # Example logic to get items (Replace with your actual relationship)
    bill_items = db.query(models.BillItem).filter(models.BillItem.bill_no == bill_no).all()

    context = {
        "bill_no": bill_record.bill_no,
        "admission_uid": bill_record.admission_uid,
        "patient_name": "NMAKOE", # Replace with: bill_record.admission.patient_name
        "items": bill_items,
        "base_amount": bill_record.total_amount,
        "tax_amount": bill_record.tax_amount,
        "total_amount": bill_record.grand_total,
        "date_str": formatted_date,
        "timestamp": int(datetime.now().timestamp())
    }

    template = Template(BILL_HTML_TEMPLATE)
    html_content = template.render(context)
    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_content, dest=pdf_buffer)
    pdf_buffer.seek(0)
    
    return Response(content=pdf_buffer.getvalue(), media_type="application/pdf")

# --- REVENUE ANALYTICS ---
@app.get("/api/finance/revenue/analytics")
async def get_revenue_analytics(
    timeframe: str = "24h", 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin)
):
    now = datetime.utcnow()
    start_time = now - timedelta(hours=24)
    if timeframe == "7D": start_time = now - timedelta(days=7)
    if timeframe == "1M": start_time = now - timedelta(days=30)
    if timeframe == "1Y": start_time = now - timedelta(days=365)
    
    bills = db.query(models.Bill).filter(models.Bill.generated_at >= start_time).all()
    total_revenue = sum(b.grand_total for b in bills)

    return {
        "kpi": {
            "total_revenue": total_revenue,
            "arpp": total_revenue / len(bills) if bills else 0,
            "occupancy_rate": 85.0,
            "growth": 12.5,
            "potential_revenue": 450000.0,
            "total_tax": sum(b.tax_amount for b in bills)
        },
        "trend": [{"time": b.generated_at.strftime("%H:00"), "revenue": b.grand_total} for b in bills[-12:]],
        "breakdown": {
            "bed_revenue": total_revenue * 0.4,
            "surgery_revenue": total_revenue * 0.4,
            "pharmacy_revenue": total_revenue * 0.2
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)












