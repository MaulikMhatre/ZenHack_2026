import requests
import json

BASE_URL = "http://localhost:8000"

def test_opd_history():
    print("Testing OPD History Endpoint...")
    
    try:
        res = requests.get(f"{BASE_URL}/api/history/opd", timeout=10)
        if res.status_code == 200:
            data = res.json()
            print(f"[SUCCESS] Received {len(data)} records.")
            if len(data) > 0:
                record = data[0]
                print("\nSample Record:")
                print(f"- Name: {record.get('patient_name')}")
                print(f"- ICD Code: {record.get('icd_code')}")
                print(f"- Urgency: {record.get('triage_urgency')}")
                print(f"- Rationale: {record.get('icd_rationale')}")
                print(f"- Priority Score: {record.get('priority_score')}")
                print(f"- Status: {record.get('status')}")
                
                # Verify filtering logic
                for r in data:
                    if r.get('status') != "COMPLETED":
                        print(f"[ERROR] Found record with status {r.get('status')}")
                        return
                print("[SUCCESS] All records have status 'COMPLETED'.")
        else:
            print(f"[ERROR] {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[FAILED] {e}")

if __name__ == "__main__":
    test_opd_history()
