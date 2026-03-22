import requests
import uuid

BASE_URL = "http://localhost:8000"

def admit_dummy():
    print("[INFO] Admitting Dummy Patient...")
    
    bed_id = "ICU-2" 
    patient_name = f"Dummy Patient {uuid.uuid4().hex[:4]}"
    
    admit_payload = {
        "bed_id": bed_id,
        "patient_name": patient_name,
        "patient_age": 30,
        "gender": "Female",
        "condition": "Stable",
        "staff_id": "S-101"
    }
    
    try:
        # Check if bed is occupied first and discharge if needed
        # But for now just try admitting
        res = requests.post(f"{BASE_URL}/api/erp/admit", json=admit_payload)
        if res.status_code == 200:
            print(f"[OK] Admitted {patient_name} to {bed_id}")
        else:
            print(f"[WARN] Failed: {res.text}")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")

if __name__ == "__main__":
    admit_dummy()
