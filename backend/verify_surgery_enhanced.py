import requests
import time
import uuid

BASE_URL = "http://localhost:8000/api"

def verify_surgery_flow():
    print("--- STARTING ENHANCED SURGERY FLOW VERIFICATION ---")
    
    # 1. Admit a patient to ER first (to get an admission_uid)
    patient_name = f"Test Surgery Patient {uuid.uuid4().hex[:4]}"
    admit_payload = {
        "bed_id": "ER-1",
        "patient_name": patient_name,
        "patient_age": 45,
        "gender": "Male",
        "condition": "Emergency",
        "staff_id": "STF001"
    }
    
    print(f"Submitting ER Admission for {patient_name}...")
    res = requests.post(f"{BASE_URL}/admit", json=admit_payload)
    if res.status_code != 200:
        print(f"Admit failed: {res.text}")
        return
    
    # 2. Extract admission_uid
    # We can get it from the live beds list
    beds_res = requests.get(f"{BASE_URL}/beds")
    beds = beds_res.json()
    er_bed = next((b for b in beds if b['id'] == 'ER-1'), None)
    
    # Wait, the admit endpoint doesn't return the uid directly in the current implementation? 
    # Let's check history to find it.
    history_res = requests.get(f"{BASE_URL}/history/clinical?date=2026-02-15") # Use today's date
    history = history_res.json()
    latest_record = next((r for r in history if r['patient_name'] == patient_name), None)
    
    if not latest_record:
        print("Record not found in history. Retrying in 2s...")
        time.sleep(2)
        history_res = requests.get(f"{BASE_URL}/history/clinical")
        history = history_res.json()
        latest_record = next((r for r in history if r['patient_name'] == patient_name), None)

    if not latest_record:
        print("Failed to find admission in history.")
        return

    adm_uid = latest_record.get('admission_uid')
    print(f"Found Admission UID: {adm_uid}")

    # 3. Start Surgery (Intermediate)
    surgery_payload = {
        "bed_id": "OT-1",
        "patient_name": patient_name,
        "patient_age": 45,
        "gender": "Male",
        "condition": "Pre-Surgery",
        "surgeon_name": "Dr. Verification",
        "duration_minutes": 120,
        "surgery_type": "Intermediate",
        "admission_uid": adm_uid
    }
    
    print("Starting Surgery (Intermediate)...")
    res = requests.post(f"{BASE_URL}/surgery/start", json=surgery_payload)
    if res.status_code != 200:
        print(f"Surgery start failed: {res.text}")
        return

    # 4. Complete Surgery
    print("Completing Surgery...")
    # Wait a bit
    time.sleep(1)
    res = requests.post(f"{BASE_URL}/surgery/complete/OT-1")
    if res.status_code != 200:
        print(f"Surgery complete failed: {res.text}")
        return

    # 5. Check Surgery History
    print("Checking Surgery History...")
    res = requests.get(f"{BASE_URL}/history/surgery")
    s_history = res.json()
    my_surgery = next((s for s in s_history if s['patient_name'] == patient_name), None)
    
    if my_surgery:
        print(f"SUCCESS: Surgery recorded in history.")
        print(f"Type: {my_surgery.get('surgery_type')}")
        print(f"UID: {my_surgery.get('admission_uid')}")
    else:
        print("FAILURE: Surgery not found in history.")

    # 6. Check Bill
    print("Generating Bill...")
    res = requests.get(f"{BASE_URL}/billing/get_bill/{adm_uid}")
    if res.status_code != 200:
        print(f"Billing fetch failed: {res.text}")
        return
    
    bill = res.json()
    print(f"Total Bill: {bill.get('total_amount_with_tax')}")
    
    # Check if 'Intermediate' surgery item is in the bill with 52,500
    found_surgery = False
    for item in bill.get('items', []):
        if item.get('name') == "Intermediate" and item.get('category') == "SURGERY":
            print(f"SUCCESS: Intermediate Surgery charge found: {item.get('total')}")
            found_surgery = True
            break
    
    if not found_surgery:
        print("FAILURE: Surgery charge not found in bill.")

    print("--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    verify_surgery_flow()
