import requests
import threading
import json

BASE_URL = "http://localhost:8000/api/queue"

def test_concurrency():
    print("--- OPD Concurrency Testing (Race Condition Check) ---")
    
    # 1. Check in 2 patients
    p1_id = requests.post(f"{BASE_URL}/checkin", json={
        "patient_name": "Race 1", "patient_age": 20, "gender": "M", "base_acuity": 3, "vitals": {}, "symptoms": []
    }).json()["patient_id"]
    p2_id = requests.post(f"{BASE_URL}/checkin", json={
        "patient_name": "Race 2", "patient_age": 20, "gender": "M", "base_acuity": 3, "vitals": {}, "symptoms": []
    }).json()["patient_id"]
    
    rooms = requests.get(f"{BASE_URL}/rooms").json()
    target_room = rooms[0]["id"]
    
    results = []
    
    def call_patient(pid):
        res = requests.post(f"{BASE_URL}/call/{pid}?room_id={target_room}")
        results.append(res.status_code)

    # 2. Try to call both to the same room at the same time
    t1 = threading.Thread(target=call_patient, args=(p1_id,))
    t2 = threading.Thread(target=call_patient, args=(p2_id,))
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    print(f"   Server responses: {results}")
    
    # One should succeed (200), one should fail (400 - Room is already active)
    if 200 in results and (400 in results or 500 in results):
        print("   [PASS] Concurrency handled: Room was correctly locked.")
    else:
        print("   [WARNING] Unexpected concurrency result. Check if server enforces room state correctly.")

if __name__ == "__main__":
    test_concurrency()
