
import traceback
import sys
from main import seed_partner_hospitals, get_db

try:
    print("Testing seed_partner_hospitals...")
    seed_partner_hospitals()
    print("Seeding successful!")
except Exception:
    traceback.print_exc()
    sys.exit(1)
