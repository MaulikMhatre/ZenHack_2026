import requests
import time

BASE_URL = "http://localhost:8000"

def test_department(bed_id, dept_name):
    print(f"\n[TEST] Verifying {dept_name} Admission Resources ({bed_id})...")
    
    # 1. Admit
    payload = {
        "bed_id": bed_id,
        "patient_name": f"{dept_name} Test Patient",
        "patient_age": 30,
        "gender": "Male",
        "condition": "Test Condition",
        "staff_id": "S-111"
    }
    
    # Clear bed
    requests.post(f"{BASE_URL}/api/erp/beds/{bed_id}/cleaning-complete")
    
    res = requests.post(f"{BASE_URL}/api/erp/admit", json=payload)
    if res.status_code != 200:
        print(f"[FAILURE] Admission failed for {dept_name}: {res.text}")
        return
        
    # Get Admission UID
    stats = requests.get(f"{BASE_URL}/api/dashboard/stats").json()
    uid = None
    for p in stats.get("patients", []):
        if p["patient_name"] == f"{dept_name} Test Patient":
            uid = p["admission_uid"]
            break
            
    if not uid:
        print(f"[FAILURE] Could not find admission UID for {dept_name}")
        return

    # 2. Check Bill Estimate
    bill = requests.get(f"{BASE_URL}/api/finance/bill/{uid}").json()
    print(f"[DATA] Resource Charge: {bill.get('resource_charge')}")
    
    # 3. Discharge to get final bill items
    requests.post(f"{BASE_URL}/api/erp/discharge/{bed_id}")
    final_bill = requests.get(f"{BASE_URL}/api/finance/bill/{uid}").json()
    
    print("[BILL ITEMS]")
    found_resources = []
    for item in final_bill.get("items", []):
        if "Resource" in item["description"]:
            found_resources.append(item["description"])
            print(f" - {item['description']}")
            
    if not found_resources:
        print(f"[FAILURE] No resources found in {dept_name} bill.")
    else:
        print(f"[SUCCESS] {len(found_resources)} resources found for {dept_name}.")

if __name__ == "__main__":
    # Test ICU
    test_department("ICU-1", "ICU")
    # Test ER
    test_department("ER-2", "ER")
    # Test Wards
    test_department("Wards-1", "Wards")
