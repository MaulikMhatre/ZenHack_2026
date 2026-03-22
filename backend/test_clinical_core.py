import requests
import json

BASE_URL = "http://localhost:8000"

def test_clinical_classify():
    print("Testing ICD-10 Clinical Intelligence Core...")
    
    test_cases = [
        {
            "complaint": "Sudden crushing chest pain radiating to left arm",
            "symptoms": "shortness of breath, sweating, nausea"
        },
        {
            "complaint": "Mild cough and slightly runny nose",
            "symptoms": "no fever, feeling okay"
        },
        {
            "complaint": "Severe abdominal pain in lower right quadrant",
            "symptoms": "nausea, vomiting, sudden onset"
        }
    ]
    
    for case in test_cases:
        print(f"\n[INPUT] Complaint: {case['complaint']}")
        try:
            res = requests.post(f"{BASE_URL}/api/clinical/classify", json=case, timeout=30)
            if res.status_code == 200:
                data = res.json()
                print(f"[RESULT] Code: {data['icd_code']}")
                print(f"[RESULT] Description: {data['official_description']}")
                print(f"[RESULT] Urgency: {data['triage_urgency']}")
                print(f"[RESULT] Rationale: {data['clinical_rationale']}")
            else:
                print(f"[ERROR] {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[FAILED] {e}")

if __name__ == "__main__":
    test_clinical_classify()
