
import traceback
import sys

try:
    print("Attempting to import main...")
    import main
    print("Import successful. Attempting to run main logic...")
    # Since main.py runs seeding on import, if it reaches here, any error happened elsewhere.
except Exception as e:
    print("Caught Exception during import/execution:")
    traceback.print_exc()
    sys.exit(1)
