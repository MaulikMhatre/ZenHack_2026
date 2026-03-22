import sqlite3

conn = sqlite3.connect('hospital_os.db')
cursor = conn.cursor()

print("\n" + "="*60)
print("CURRENT STAFF USERS IN DATABASE")
print("="*60)

cursor.execute('SELECT id, name, role FROM staff')
users = cursor.fetchall()

if users:
    for user_id, name, role in users:
        print(f"\nID: {user_id}")
        print(f"Name: {name}")
        print(f"Role: {role}")
        print("-" * 40)
else:
    print("\n⚠️  No staff users found in database!")

conn.close()
