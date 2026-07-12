# IAM Backend API & Middleware: AssetFlow ERP

This document contains the backend API specifications, security middlewares, and JWT validation designs for **AssetFlow ERP**.

---

## 1. Authentication Router (`/api/v1/auth`)

---

### 1.1 `POST /login`
*   **Request Schema**:
    ```json
    {
      "email": "user@company.com",
      "password": "SecurePassword123"
    }
    ```
*   **Headers Set**: `Set-Cookie: Refresh_Token=<string>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
*   **Response Schema (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "expires_in": 900
    }
    ```

---

### 1.2 `POST /logout`
*   **Request Schema**: Empty body (reads Refresh Token cookie).
*   **Response Schema (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Session invalidated successfully."
    }
    ```

---

### 1.3 `POST /refresh`
*   **Request Schema**: Empty body (reads Refresh Token cookie).
*   **Headers Set**: Updates cookie with a rotated Refresh Token.
*   **Response Schema (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "expires_in": 900
    }
    ```

---

## 2. JWT Payload Claims

Access tokens are stateless and contain the following fields:
*   `sub`: UUID (User ID)
*   `email`: String (User email)
*   `role`: String (User role code, e.g., `'accountant'`)
*   `permissions`: Array of strings (Granular permissions, e.g., `["asset:create", "finance:read"]`)
*   `exp`: Integer (Expiration timestamp)
*   `iss`: String (Issuer identifier)

---

## 3. RBAC Middleware & Security Dependencies

Authorization checks are executed as FastAPI dependencies:

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from app.api.dependencies.security import get_current_user
from app.models.user import User

class PermissionChecker:
    def __init__(self, required_permissions: list[str]):
        self.required_permissions = required_permissions

    def __call__(self, current_user: User = Depends(get_current_user)):
        for perm in self.required_permissions:
            if perm not in current_user.permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions to execute this operation."
                )
        return current_user
```

### Usage in Routers:
```python
@router.post("/assets", dependencies=[Depends(PermissionChecker(["asset:create"]))])
def create_asset(payload: AssetCreateSchema):
    return asset_service.create(payload)
```

---

## 4. Rate Limiting Middleware

To mitigate brute-force and Denial of Service (DoS) attacks:
*   **Login Router**: Limit login attempts to **5 requests per minute** per IP address.
*   **General Routes**: Limit requests to **100 requests per minute** per authenticated user ID.
*   **Headers Returned**:
    *   `X-RateLimit-Limit`: Maximum requests allowed in the time window.
    *   `X-RateLimit-Remaining`: Remaining requests allowed in the current window.
    *   `X-RateLimit-Reset`: Epoch timestamp when the rate limit resets.
*   **Exceeding Limits**: Returns an `HTTP 429 Too Many Requests` error response.
