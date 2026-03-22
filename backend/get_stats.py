import requests
import json

try:
    res = requests.get("http://localhost:8000/api/dashboard/stats")
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
