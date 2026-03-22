import requests
import uuid
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_financial_flow():
    print("[START] Starting Financial Flow Test...")
    
    # 1. Login (Mock or Real)
    # Assuming no auth for internal endpoints or using a test token if needed.
    # The current main.py protects some endpoints with Depends(get_db) but not auth? 
    # Wait, main.py has `login` endpoint but `admit_patient` just `Depends(get_db)`.
    # It DOES NOT strict check auth token in `admit_patient` unless `get_current_user` is used.
    # Looking at main.py: `async def admit_patient(request: AdmissionRequest, db: Session = Depends(get_db)):`
    # It seems open for now (or strictly internal).
    
    # 2. Admit Patient
    bed_id = "ICU-1" # Ensure this bed exists from seed
    patient_name = f"Test Patient {uuid.uuid4().hex[:4]}"
    print(f"[INFO] Admitting {patient_name} to {bed_id}...")
    
    admit_payload = {
        "bed_id": bed_id,
        "patient_name": patient_name,
        "patient_age": 45,
        "gender": "Male",
        "condition": "Stable",
        "staff_id": "S-101"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/erp/admit", json=admit_payload)
        if res.status_code != 200:
            # Maybe bed is occupied? Try to discharge first or find another
            print(f"[WARN] Admission failed: {res.text}. Attempting force discharge...")
            requests.post(f"{BASE_URL}/api/erp/discharge/{bed_id}")
            requests.post(f"{BASE_URL}/api/erp/beds/{bed_id}/cleaning-complete")
            res = requests.post(f"{BASE_URL}/api/erp/admit", json=admit_payload)
            
        res.raise_for_status()
        print("[OK] Admission Successful")
        
    except Exception as e:
        print(f"[ERROR] Critical Error in Admission: {e}")
        return

    # 3. Simulate Surgery
    print("[INFO] Starting Surgery...")
    surgery_payload = {
        "bed_id": bed_id,
        "patient_name": patient_name,
        "patient_age": 45,
        "surgeon_name": "Dr. Strange",
        "duration_minutes": 120 # Major/Intermediate
    }
    res = requests.post(f"{BASE_URL}/api/surgery/start", json=surgery_payload)
    print(f"   Surgery Start: {res.status_code}")
    
    # Complete Surgery
    res = requests.post(f"{BASE_URL}/api/surgery/complete/{bed_id}")
    print(f"   Surgery Complete: {res.status_code}")
    if res.status_code == 200:
        print("[OK] Surgery Logged & Charged")

    # 4. Discharge & Generate Bill
    print("[INFO] Discharging Patient...")
    res = requests.post(f"{BASE_URL}/api/erp/discharge/{bed_id}")
    print(f"   Discharge Status: {res.status_code}")
    
    bill_data = res.json().get("bill")
    if bill_data:
        print(f"[BILL] Bill Generated: {bill_data['bill_no']}")
        print(f"   Grand Total: {bill_data['grand_total']}")
        
        # Verify Bill Details
        # We need to fetch admission UID to define it? 
        # The discharge response gave us the bill preview directly?
        # main.py: `return {"status": "success", "bill": bill_data}` -> Yes.
        
        # 5. Check Revenue Analytics
        print("[INFO] Checking Revenue Dashboard...")
        res = requests.get(f"{BASE_URL}/api/finance/revenue/analytics?timeframe=24h")
        if res.status_code == 200:
            data = res.json()
            print(f"   Total Revenue (24h): {data['kpi']['total_revenue']}")
            print(f"   ARPP: {data['kpi']['arpp']}")
            print(f"   Trend Data Points: {len(data.get('trend', []))}")
            print("[OK] Analytics Endpoint Working")
        else:
            print(f"[ERROR] Analytics Failed: {res.text}")

    else:
        print("[ERROR] No Bill returned on discharge!")

if __name__ == "__main__":
    test_financial_flow()
