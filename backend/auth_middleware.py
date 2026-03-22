"""
Authentication Middleware for RBAC System
Provides JWT token validation and role-based access control
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from datetime import datetime

# Security Configuration
SECRET_KEY = "your_super_secret_hospital_key"  # Should match main.py
ALGORITHM = "HS256"

security = HTTPBearer()

def log_audit_event(
    db: Session,
    staff_id: str,
    role: str,
    action: str,
    resource_path: str,
    ip_address: str,
    details: Optional[str] = None
):
    """Utility to create an audit log entry"""
    audit_entry = models.AuditLog(
        staff_id=staff_id,
        staff_role=role,
        action=action,
        resource_path=resource_path,
        ip_address=ip_address,
        details=details
    )
    db.add(audit_entry)
    db.commit()

class CurrentUser:
    """Data class to hold current authenticated user information"""
    def __init__(self, staff_id: str, role: str, name: str = None):
        self.staff_id = staff_id
        self.role = role
        self.name = name
    
    def has_role(self, allowed_roles: List[str]) -> bool:
        """Check if user has one of the allowed roles"""
        return self.role in allowed_roles


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """
    Dependency to extract and validate JWT token from request headers.
    Returns CurrentUser object with staff_id and role.
    
    Also automatically logs requests to /api/erp/ and /api/finance/ endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        staff_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if staff_id is None or role is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Verify user exists in database
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    current_user = CurrentUser(staff_id=staff.id, role=staff.role, name=staff.name)

    # HIPAA: Automatically log access to sensitive ERP/Finance paths
    path = request.url.path
    if path.startswith("/api/erp/") or path.startswith("/api/finance/"):
        log_audit_event(
            db=db,
            staff_id=current_user.staff_id,
            role=current_user.role,
            action="DATA_VIEW",
            resource_path=path,
            ip_address=request.client.host if request.client else "unknown",
            details=f"Access to {path}"
        )
    
    return current_user


def require_role(allowed_roles: List[str]):
    """
    Dependency factory to create role-based access control.
    
    Usage:
        @app.get("/admin/revenue")
        async def get_revenue(user: CurrentUser = Depends(require_role(["Admin"]))):
            # Only Admin can access this endpoint
            pass
    
    Args:
        allowed_roles: List of role strings that are allowed to access the endpoint
                      Valid values: ["Admin", "Doctor", "Nurse"]
    
    Returns:
        Dependency function that validates user role
        
    Raises:
        HTTPException 403: If user role is not in allowed_roles
    """
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not current_user.has_role(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}. Your role: {current_user.role}"
            )
        return current_user
    
    return role_checker


# Convenience dependencies for common role combinations
require_admin = require_role(["Admin"])
require_admin_or_doctor = require_role(["Admin", "Doctor"])
require_any_staff = require_role(["Admin", "Doctor", "Nurse"])
