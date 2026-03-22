import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_surgery_flow():
    print("--- Starting Surgery Unit API Verification ---")
    bed_id = "SURG-1"
    
    print(f"\n1. Starting Surgery on {bed_id}...")
    try:
        res = requests.post(f"{BASE_URL}/surgery/start", json={
            "bed_id": bed_id,
            "patient_name": "Test Patient",
            "surgeon_name": "Dr. Verification",
            "duration_minutes": 60
        })
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        if res.status_code != 200: return
    except Exception as e:
        print(f"Request Failed: {e}")
        return

    # 2. Extend Surgery
    print(f"\n2. Extending Surgery on {bed_id}...")
    try:
        res = requests.post(f"{BASE_URL}/surgery/extend/{bed_id}", json={
            "additional_minutes": 30
        })
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Request Failed: {e}")

    # 3. Complete Surgery
    print(f"\n3. Completing Surgery on {bed_id}...")
    try:
        res = requests.post(f"{BASE_URL}/surgery/complete/{bed_id}")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Request Failed: {e}")

    # 4. Release Room
    print(f"\n4. Releasing Room {bed_id}...")
    try:
        res = requests.post(f"{BASE_URL}/surgery/release/{bed_id}")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    test_surgery_flow()
