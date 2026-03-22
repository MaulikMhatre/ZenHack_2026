import requests
import json

BASE_URL = "http://localhost:8000"

def test_manual_admission():
    print(f"Testing Admission to {BASE_URL}...")
    
    # 1. Test Ward Admission (Medical - Gender Check)
    print("\n1. Testing Ward Admission (Medical - Male)...")
    payload = {
        "bed_id": "Wards-1", # Assuming Wards-1 is Male from seed
        "patient_name": "Manual Test User",
        "patient_age": 45,
        "gender": "Male",
        "condition": "Stable",
        "staff_id": "BOARD_ADMIN" # Matches what might be sent if staff_id is mocked
    }
    
    try:
        # First ensure bed is free (optional, or just try admit)
        res = requests.post(f"{BASE_URL}/api/erp/admit", json=payload)
        if res.status_code == 200:
            print("   [PASS] Ward Admission Successful.")
            # Clean up (Discharge)
            requests.post(f"{BASE_URL}/api/erp/discharge/Wards-1")
        elif res.status_code == 400 and "Occupied" in res.text:
             print("   [NOTE] Bed Wards-1 already occupied. Skipping or Discharging first.")
             requests.post(f"{BASE_URL}/api/erp/discharge/Wards-1")
             # Retry
             res = requests.post(f"{BASE_URL}/api/erp/admit", json=payload)
             if res.status_code == 200: print("   [PASS] Retry Successful.")
             else: print(f"   [FAIL] Retry Failed: {res.text}")
        else:
             print(f"   [FAIL] Ward Admission Failed: {res.status_code} - {res.text}")
             
    except Exception as e:
        print(f"   [ERROR] Request Failed: {e}")

    # 2. Test Surgery Admission Endpoint (to verify path)
    # Backend path is /api/surgery/start
    print("\n2. Testing Surgery Admission ...")
    surgery_payload = {
        "bed_id": "SURG-1",
        "patient_name": "Surg Test User",
        "patient_age": 50,
        "gender": "Female",
        "condition": "Pre-Surgery",
        "staff_id": "BOARD_ADMIN",
        "surgeon_name": "Dr. Strange",
        "duration_minutes": 120
    }
    try:
        res = requests.post(f"{BASE_URL}/api/surgery/start", json=surgery_payload)
        if res.status_code == 200:
            print("   [PASS] Surgery Start Successful.")
            requests.post(f"{BASE_URL}/api/surgery/release/SURG-1")
        elif res.status_code == 400 and "Occupied" in res.text:
            print("   [NOTE] SURG-1 Occupied. Clearing...")
            requests.post(f"{BASE_URL}/api/surgery/release/SURG-1")
            res = requests.post(f"{BASE_URL}/api/surgery/start", json=surgery_payload)
            if res.status_code == 200: print("   [PASS] Retry Surgery Successful.")
            else: print(f"   [FAIL] Surgery Failed: {res.text}")
        else:
            print(f"   [FAIL] Surgery Failed: {res.status_code} - {res.text}")
            
    except Exception as e:
        print(f"   [ERROR] Request Failed: {e}")

if __name__ == "__main__":
    test_manual_admission()
