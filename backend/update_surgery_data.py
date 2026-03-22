import sqlite3

def update_db():
    conn = sqlite3.connect('c:/Phrelis_ERP/backend/hospital_os.db')
    cursor = conn.cursor()
    
    updates = [
        (12500, "Minor"),
        (52500, "Intermediate"),
        (150000, "Major"),
        (425000, "Specialized")
    ]
    
    for price, name in updates:
        cursor.execute("UPDATE price_master SET price = ? WHERE name = ?", (price, name))
        if cursor.rowcount == 0 and name == "Specialized":
             # If Specialized doesn't exist, try updating Complex to Specialized
             cursor.execute("UPDATE price_master SET price = ?, name = ? WHERE name = ?", (price, name, "Complex"))
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT name, price FROM price_master WHERE category = 'SURGERY'")
    print("Updated Surgery Prices:", cursor.fetchall())
    
    conn.close()

if __name__ == "__main__":
    update_db()
