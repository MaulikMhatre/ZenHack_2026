import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_triage():
    print(f"Testing Connectivity to {BASE_URL}...")
    try:
        # 1. Test Fetch (Health Check)
        print("1. Pinging Server...")
        requests.get(f"{BASE_URL}/docs", timeout=5) 
        print("[OK] Server is reachable.")
    except Exception as e:
        print(f"[ERROR] Server Unreachable. Error: {e}")
        print("POSSIBLE CAUSE: The backend server might be down or crashed due to database schema mismatch.")
        return

    # 2. Test Female Allocation
    print("\n2. Testing Female Allocation Logic...")
    payload_female = {
        "patient_name": "Jane Test",
        "patient_age": 30,
        "gender": "Female",
        "vitals": {"spo2": 98, "heart_rate": 75}, # Stable -> Wards
        "symptoms": ["Mild Fever", "Cough"]
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/triage/assess", json=payload_female)
        if res.status_code == 200:
            data = res.json()
            bed_id = data.get("assigned_bed", "WAITING_LIST")
            print(f"   [RESULT] Female Patient Assigned to: {bed_id}")
            
            # Check Ward Range
            if "Wards" in bed_id:
                bed_num = int(bed_id.split("-")[1])
                if 21 <= bed_num <= 40:
                     print("   [PASS] Correctly assigned to Female Ward (Range 21-40).")
                else:
                     print(f"   [FAIL] Assigned to wrong Ward range ({bed_num}). Expecting 21-40.")
            else:
                 print(f"   [NOTE] Assigned to {bed_id} (Not a Ward). Check ESI Level.")
        else:
            print(f"   [API ERROR] {res.status_code}: {res.text}")

    except Exception as e:
        print(f"   [REQUEST FAILED] {e}")

    # 3. Test Male Allocation
    print("\n3. Testing Male Allocation Logic...")
    payload_male = {
        "patient_name": "John Test",
        "patient_age": 30,
        "gender": "Male",
        "vitals": {"spo2": 98, "heart_rate": 75}, # Stable -> Wards
        "symptoms": ["Mild Fever"]
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/triage/assess", json=payload_male)
        if res.status_code == 200:
            data = res.json()
            bed_id = data.get("assigned_bed", "WAITING_LIST")
            print(f"   [RESULT] Male Patient Assigned to: {bed_id}")
            
            # Check Ward Range
            if "Wards" in bed_id:
                bed_num = int(bed_id.split("-")[1])
                if 1 <= bed_num <= 20:
                     print("   [PASS] Correctly assigned to Male Ward (Range 1-20).")
                else:
                     print(f"   [FAIL] Assigned to wrong Ward range ({bed_num}). Expecting 1-20.")
        else:
            print(f"   [API ERROR] {res.status_code}: {res.text}")

    except Exception as e:
        print(f"   [REQUEST FAILED] {e}")

if __name__ == "__main__":
    test_triage()
