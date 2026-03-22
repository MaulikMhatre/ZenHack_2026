
import requests
import time

BASE_URL = "http://localhost:8000/api"

def test_opd_billing_flow():
    # 1. Check in a patient
    triage_data = {
        "patient_name": "Ledger Test Patient",
        "patient_age": 45,
        "gender": "M",
        "base_acuity": 4, # ESI
        "vitals": {"hr": 78, "bp": "120/80", "spo2": 98},
        "symptoms": ["Mild Headache"]
    }
    res = requests.post(f"{BASE_URL}/queue/checkin", json=triage_data)
    patient_id = res.json()["patient_id"]
    print(f"Checked in: {patient_id}")

    # 2. Get Room ID
    rooms = requests.get(f"{BASE_URL}/queue/rooms").json()
    room_id = rooms[0]["id"]

    # 3. Call to room
    requests.post(f"{BASE_URL}/queue/call/{patient_id}?room_id={room_id}")
    print(f"Called to {room_id}")

    # 4. Fetch revenue analytics
    time.sleep(1) # Wait for commit
    res = requests.get(f"{BASE_URL}/finance/revenue/analytics")
    print("Revenue Breakdown:", res.json()["breakdown"])
    
    # 5. Fetch Ledger
    res = requests.get(f"{BASE_URL}/finance/ledger")
    print("Ledger Entry Count:", len(res.json()["transactions"]))

if __name__ == "__main__":
    try:
        test_opd_billing_flow()
    except Exception as e:
        print(f"Error: {e}")
