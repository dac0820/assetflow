# Role Based Permission Flow: AssetFlow ERP

This document details the **Role-Based Access Control (RBAC)** architecture, permission rules, and implementation steps for **AssetFlow ERP**.

---

## 1. System Roles Definition

AssetFlow ERP has four predefined user roles, each mapping to specific functional areas:

1.  **`admin`**: System administrator. Has full, destructive, and non-destructive access across all modules. Responsible for user management, system configuration, and data auditing.
2.  **`manager`**: Operational manager. Focuses on asset registration, assignment updates, initiating transfers, and audit scheduling. Cannot run financial depreciation calculations.
3.  **`accountant`**: Financial administrator. Focuses on asset purchase cost records, calculating depreciation, running financial analytics, and reading general registers. Cannot create users or schedule physical audits.
4.  **`viewer`**: Read-only stakeholder (e.g., auditors, executive directors). Can view asset lists, financial valuation reports, and audit logs, but cannot execute any modifications.

---

## 2. RBAC Permissions Matrix

| Permission | Description | Admin | Manager | Accountant | Viewer |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **USER_CREATE** | Register new system users | ✅ | ❌ | ❌ | ❌ |
| **USER_EDIT** | Edit user properties & roles | ✅ | ❌ | ❌ | ❌ |
| **ASSET_CREATE** | Register new physical/digital assets | ✅ | ✅ | ❌ | ❌ |
| **ASSET_EDIT** | Modify asset metadata | ✅ | ✅ | ❌ | ❌ |
| **ASSET_DELETE** | Archive or permanently retire assets | ✅ | ❌ | ❌ | ❌ |
| **ASSET_TRANSFER** | Approve and document location shifts | ✅ | ✅ | ❌ | ❌ |
| **FINANCE_CALC** | Calculate monthly asset depreciation | ✅ | ❌ | ✅ | ❌ |
| **FINANCE_READ** | View valuation lists and schedules | ✅ | ✅ | ✅ | ✅ |
| **AUDIT_SCHEDULE** | Schedule verification tasks | ✅ | ✅ | ❌ | ❌ |
| **AUDIT_EXECUTE** | Perform checks & log results | ✅ | ✅ | ❌ | ❌ |

---

## 3. Authorization Middleware Design (FastAPI)

Authorization checks are executed as native FastAPI dependencies. This ensures checks happen before any database transactions or business logic executes.

```
[Incoming HTTP Request]
         │
         ▼
[Verify Access Token (JWT)] ──(Invalid)──> [HTTP 401 Unauthorized]
         │ (Valid)
         ▼
[Extract "role" Claim]
         │
         ▼
[Check Permission Requirement] ──(Fails)──> [HTTP 403 Forbidden]
         │ (Passes)
         ▼
[Execute Controller Function]
```

### 3.1 Code Pattern for Permission Enforcement
FastAPI dependencies (`Depends`) are utilized to assert permissions:

```python
# app/core/security.py
from fastapi import HTTPException, Depends, status
from app.modules.auth.services import get_current_user
from app.modules.auth.models import User

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user role."
            )
        return current_user

# Example router usage
# app/modules/finance/router.py
@router.post("/depreciation/calculate")
def run_depreciation(
    payload: CalculationRequest,
    current_user: User = Depends(RoleChecker(["admin", "accountant"]))
):
    # Only Admin or Accountant users can reach here
    return finance_service.execute_calculation(payload)
```
Using this approach, permission issues are blocked at the router gateway before loading database objects or initiating database writes.
