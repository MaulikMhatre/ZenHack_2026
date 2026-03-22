import requests
import json
import time

BASE_URL = "http://localhost:8000"

def verify_icu_billing():
    print("[INFO] Starting ICU Billing Verification...")
    
    # 1. Admit to ICU bed
    bed_id = "ICU-5"
    patient_name = "Verification Patient"
    
    admit_payload = {
        "bed_id": bed_id,
        "patient_name": patient_name,
        "patient_age": 45,
        "gender": "Male",
        "condition": "Critical",
        "staff_id": "S-101"
    }
    
    # Clear bed first just in case
    requests.post(f"{BASE_URL}/api/erp/beds/{bed_id}/cleaning-complete")
    
    print(f"[STEP 1] Admitting {patient_name} to {bed_id}...")
    res = requests.post(f"{BASE_URL}/api/erp/admit", json=admit_payload)
    if res.status_code != 200:
        print(f"❌ Admission failed: {res.text}")
        return
    
    # Get Admission UID
    # We can get it from the Patient List or a separate query
    stats = requests.get(f"{BASE_URL}/api/dashboard/stats").json()
    admission_uid = None
    for p in stats.get("patients", []):
        if p["patient_name"] == patient_name:
            admission_uid = p["admission_uid"]
            break
    
    if not admission_uid:
        print("[FAILURE] Could not find admission UID")
        return
        
    print(f"[DATA] Admission UID: {admission_uid}")
    
    # 2. Check Estimate
    print(f"[STEP 2] Checking Bill Estimate...")
    bill_res = requests.get(f"{BASE_URL}/api/finance/bill/{admission_uid}")
    bill_data = bill_res.json()
    print(f"[DATA] Estimate Total: INR {bill_data.get('total')}")
    
    if bill_data.get('total') == 20000.0:
        print("[SUCCESS] Correct ICU Rate (20,000) applied in estimate.")
    else:
        print(f"[FAILURE] Wrong rate in estimate: {bill_data.get('total')}")

    # 3. Discharge and Generate Final Bill
    print(f"[STEP 3] Discharging patient...")
    # Add a mock surgery to test stacking
    db_update_url = f"{BASE_URL}/api/erp/discharge/{bed_id}"
    # Wait a bit? No need, same day logic should work.
    
    res = requests.post(db_update_url)
    if res.status_code != 200:
        print(f"[FAILURE] Discharge failed: {res.text}")
        return
        
    print(f"[INFO] Discharged. Checking FINAL bill...")
    final_bill_res = requests.get(f"{BASE_URL}/api/finance/bill/{admission_uid}")
    final_data = final_bill_res.json()
    
    print(json.dumps(final_data, indent=2))
    
    if final_data.get("status") == "FINAL":
        print(f"[SUCCESS] Final Bill Generated: {final_data.get('bill_no')}")
        if final_data.get("grand_total") >= 20000.0:
            print("[RESULT] SUCCESS: ICU Billing Verified.")
        else:
             print("[FAILURE] Error: Total amount is still wrong.")
    else:
        print("[FAILURE] Error: Status is not FINAL")

if __name__ == "__main__":
    verify_icu_billing()
