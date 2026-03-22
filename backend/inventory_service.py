from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import models

class InventoryService:
    @staticmethod
    def deduct_stock(db: Session, item_name: str, quantity: int, patient_name: str = "Unknown", bed_id: str = None, condition: str = None, admission_uid: str = None):
        """
        Deducts stock for a specific item.
        Triggers a low stock alert if quantity falls below reorder level.
        Returns the updated item and whether an alert is needed.
        """
        item = db.query(models.InventoryItem).filter(models.InventoryItem.name == item_name).first()
        
        if not item:
            print(f"Warning: Inventory item '{item_name}' not found.")
            return None, False

        # Deduct quantity (prevent negative stock)
        deducted_qty = min(item.quantity, quantity)
        item.quantity -= deducted_qty
        
        # Log the usage
        log = models.InventoryLog(
            item_id=item.id,
            admission_uid=admission_uid,
            patient_name=patient_name,
            bed_id=bed_id,
            quantity_used=deducted_qty,
            reason=f"Usage for {condition}" if condition else "Standard Usage",
            timestamp=datetime.utcnow()
        )
        db.add(log)
        
        is_low_stock = item.quantity < item.reorder_level
        return item, is_low_stock

    @staticmethod
    async def process_usage(db: Session, manager, context: str, patient_data: dict):
        """
        Orchestrates deductions based on clinical context (e.g., 'ICU', 'Surgery').
        Broadcasts alerts via WebSocket if thresholds are breached.
        """
        items_to_deduct = []
        patient_name = patient_data.get("patient_name", "Unknown")
        bed_id = patient_data.get("bed_id")
        condition = patient_data.get("condition", "")
        admission_uid = patient_data.get("admission_uid") # [NEW] uid for tracking

        # 1. Determine Items based on Department Category
        # Mapping context to InventoryItem.category
        mapping = {
            "ICU": "ICU",
            "ER": "ER",
            "Wards": "General",
            "Surgery": "Surgery"
        }
        
        target_cat = mapping.get(context)
        if not target_cat and context.startswith("Surgery"):
            target_cat = "Surgery"
            
        if target_cat:
            cat_items = db.query(models.InventoryItem).filter(models.InventoryItem.category == target_cat).all()
            for item in cat_items:
                items_to_deduct.append((item.name, 1)) # Standard Admission Kit: 1 of each
        elif context == "OPD_Consultation":
             items_to_deduct.extend([("Gloves", 2), ("Tongue Depressor", 1)])

        # 2. Global Overrides (Infection Control)
        if "infec" in condition.lower() or "isolation" in condition.lower():
            items_to_deduct.append(("PPE Kit", 1))

        # [NEW] Cleaning Context
        if context == "Cleaning":
             items_to_deduct.extend([("Sanitization Kit", 1), ("Bed Linens", 1)])

        # 3. Process Executions
        alerts = []
        for item_name, qty in items_to_deduct:
            updated_item, is_low = InventoryService.deduct_stock(db, item_name, qty, patient_name, bed_id, condition, admission_uid)
            if updated_item and is_low:
                alerts.append(updated_item)

        db.commit()

        # 4. Broadcast Updates
        if items_to_deduct:
             # Just tell frontend to refresh inventory
             await manager.broadcast({"type": "REFRESH_INVENTORY"})

        # 5. Broadcast Specific Alerts
        for alert_item in alerts:
            await manager.broadcast({
                "type": "LOW_STOCK_ALERT",
                "item_name": alert_item.name,
                "remaining": alert_item.quantity,
                "message": f"CRITICAL: {alert_item.name} is low ({alert_item.quantity} remaining)!"
            })
