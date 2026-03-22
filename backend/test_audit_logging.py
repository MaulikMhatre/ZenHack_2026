import requests
import time

BASE_URL = "http://localhost:8000"

def test_audit_flow():
    print("--- Phrelis Audit Logging Verification ---")
    
    # 1. Test Login
    print("\n1. Testing Login...")
    # Using a known staff ID from common seed 
    login_data = {"staff_id": "ADMIN-01", "password": "password"} 
    login_res = requests.post(f"{BASE_URL}/api/login", json=login_data)
    
    if login_res.status_code != 200:
        print(f"FAILED: Login failed with {login_res.status_code}")
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Logged in.")

    # 2. Test Path Logging (ERP Access)
    print("\n2. Testing Path Logging (/api/erp/beds)...")
    beds_res = requests.get(f"{BASE_URL}/api/erp/beds", headers=headers)
    if beds_res.status_code == 200:
        print("SUCCESS: ERP path accessed.")
    else:
        print(f"FAILED: ERP access returned {beds_res.status_code}")

    # 3. Test Unauthorized Access (Security Breach)
    # We need a non-admin token to test this, or just try to access without token
    print("\n3. Testing Security Breach (Admin endpoint as guest)...")
    admin_res = requests.get(f"{BASE_URL}/api/admin/audit-logs")
    if admin_res.status_code == 401: # Unauthorized because no token
        print("SUCCESS: Blocked (401).")
    
    # 4. Test Audit Log Retrieval (Admin Only)
    print("\n4. Testing Audit Log Retrieval (Admin)...")
    logs_res = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=headers)
    if logs_res.status_code == 200:
        logs = logs_res.json()
        print(f"SUCCESS: Retrieved {len(logs)} log entries.")
        for log in logs[:5]:
            print(f"  [{log['timestamp']}] {log['staff_role']} {log['action']} -> {log['resource_path']}")
    else:
        print(f"FAILED: Could not retrieve logs: {logs_res.status_code} - {logs_res.text}")

    # 5. Test Logout
    print("\n5. Testing Manual Logout...")
    logout_res = requests.post(f"{BASE_URL}/api/logout", headers=headers)
    if logout_res.status_code == 200:
        print("SUCCESS: Logged out.")
    else:
        print(f"FAILED: Logout failed with {logout_res.status_code}")

if __name__ == "__main__":
    try:
        test_audit_flow()
    except Exception as e:
        print(f"Error during verification: {e}")
        print("Make sure the backend is running at http://localhost:8000")
