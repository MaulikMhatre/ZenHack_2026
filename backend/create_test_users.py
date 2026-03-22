"""
Create test users for RBAC system testing
Creates Admin, Doctor, and Nurse accounts with simple passwords
"""

import sqlite3
from passlib.context import CryptContext

# Password hashing context (same as main.py)
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
conn = sqlite3.connect('hospital_os.db')
cursor = conn.cursor()

print("\n" + "="*60)
print("CREATING TEST USERS FOR RBAC SYSTEM")
print("="*60)

# Test users with simple passwords for development
test_users = [
    {
        'id': 'ADMIN-01',
        'name': 'Admin User',
        'role': 'Admin',
        'password': 'admin123',
        'department_id': None
    },
    {
        'id': 'DOC-01',
        'name': 'Dr. Smith',
        'role': 'Doctor',
        'password': 'doctor123',
        'department_id': 'General'
    },
    {
        'id': 'NURSE-01',
        'name': 'Nurse Johnson',
        'role': 'Nurse',
        'password': 'nurse123',
        'department_id': 'General'
    }
]

for user in test_users:
    # Check if user already exists
    cursor.execute('SELECT id FROM staff WHERE id = ?', (user['id'],))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing user's role
        cursor.execute('''
            UPDATE staff 
            SET name = ?, role = ?, department_id = ?
            WHERE id = ?
        ''', (user['name'], user['role'], user['department_id'], user['id']))
        print(f"\n✅ Updated: {user['id']}")
    else:
        # Create new user
        hashed_password = PWD_CONTEXT.hash(user['password'])
        cursor.execute('''
            INSERT INTO staff (id, name, role, hashed_password, is_clocked_in, department_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user['id'], user['name'], user['role'], hashed_password, False, user['department_id']))
        print(f"\n✅ Created: {user['id']}")
    
    print(f"   Name: {user['name']}")
    print(f"   Role: {user['role']}")
    print(f"   Password: {user['password']}")
    print("-" * 40)

conn.commit()
conn.close()

print("\n" + "="*60)
print("LOGIN CREDENTIALS")
print("="*60)
print("\n🔐 ADMIN LOGIN:")
print("   Staff ID: ADMIN-01")
print("   Password: admin123")
print("   Access: All modules + Revenue Analytics")

print("\n🔐 DOCTOR LOGIN:")
print("   Staff ID: DOC-01")
print("   Password: doctor123")
print("   Access: Dashboard, OPD, Triage, Surgery (No Revenue)")

print("\n🔐 NURSE LOGIN:")
print("   Staff ID: NURSE-01")
print("   Password: nurse123")
print("   Access: OPD, Triage, Smart Nursing (No Admin/Revenue)")

print("\n" + "="*60)
print("✅ Test users created successfully!")
print("="*60 + "\n")
