import requests
import json

BASE_URL = "http://localhost:8000"

def test_analytics():
    try:
        # Note: We might need an admin token if RBAC is active
        # Attempting a direct call first
        res = requests.get(f"{BASE_URL}/api/finance/revenue/analytics?timeframe=24h")
        if res.status_code == 403:
            print("RBAC Active: Verification requires admin token.")
            return
        
        data = res.json()
        print(f"Status Code: {res.status_code}")
        print("Response Structure:")
        print(json.dumps(data, indent=2))
        
        # Verify keys
        expected_kpis = ["total_revenue", "arpp", "occupancy_rate", "growth", "potential_revenue", "total_tax"]
        for k in expected_kpis:
            if k not in data["kpi"]:
                print(f"MISSING KPI: {k}")
        
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_analytics()
