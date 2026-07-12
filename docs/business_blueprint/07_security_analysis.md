# Security Analysis & Threats Mitigations: AssetFlow ERP

This report identifies potential security vulnerabilities in **AssetFlow ERP** and defines our mitigation strategies.

---

## 1. Threat Matrix & Mitigations

---

### 1.1 Insecure Direct Object References (IDOR) / Broken Access Control
*   **Attack Scenario**: A regular employee modifies the URL parameter `GET /api/v1/assets/99f7e8b9-feeb-428f-8d7b-9f3d407bcb48` to access a high-value asset registered under a different department, bypassing UI visibility controls.
*   **Mitigation Strategy**:
    *   **Backend Validation**: The FastAPI router checks that the user's department matches the asset's department before returning data.
    *   **UUID Usage**: Primary keys use cryptographically random **UUIDv4** instead of auto-incrementing integers (`1, 2, 3...`), preventing brute-force enumeration.

---

### 1.2 Privilege Escalation
*   **Attack Scenario**: A user demoted to "Viewer" intercepts the `PATCH /api/v1/users/me` request and injects `"role": "admin"` into the JSON payload to elevate their permissions.
*   **Mitigation Strategy**:
    *   **Strict Role Checks**: Role changes can only be requested through the `/api/v1/users/{id}` admin route. Demotions or promotions require authorization checks:
        ```python
        depends(RoleChecker(["admin"]))
        ```
    *   **Pydantic Input Filtering**: The User Update schema excludes the `role` field from standard user profiles, preventing parameter injection.

---

### 1.3 SQL Injection (SQLi)
*   **Attack Scenario**: A user inputs `' OR '1'='1` in the asset search bar, attempting to dump the entire database contents.
*   **Mitigation Strategy**:
    *   **SQLAlchemy ORM**: All database interactions use SQLAlchemy, which automatically parameterizes queries and treats user input as values rather than executable code.
    *   **Input Sanitization**: Input validation rules strip special SQL control characters from text inputs.

---

### 1.4 JWT Misuse & Token Hijacking
*   **Attack Scenario**: An attacker intercepts a JWT token and uses it to make unauthorized requests from an external machine.
*   **Mitigation Strategy**:
    *   **Short Lifetimes**: Access tokens expire after 15 minutes, limiting the window of opportunity for stolen tokens.
    *   **Secure Storage**: Refresh tokens are stored in `HttpOnly`, `Secure`, and `SameSite=Strict` cookies, protecting them from theft via JavaScript (XSS).
    *   **Signature Verification**: The backend uses an environment-configured `JWT_SECRET` key to verify token signatures on every request.

---

### 1.5 Cross-Site Request Forgery (CSRF)
*   **Attack Scenario**: A user visits a malicious website that attempts to send a post request to the ERP backend while the user is logged in, using their active browser session.
*   **Mitigation Strategy**:
    *   **Bearer Tokens**: API requests require the JWT token to be sent in the `Authorization: Bearer` header. Browsers do not automatically attach this header, blocking CSRF attacks.
    *   **SameSite Cookie Rules**: The Refresh Token cookie is restricted via `SameSite=Strict`, blocking cross-domain credential transmission.

---

### 1.6 Audit Log Tampering
*   **Attack Scenario**: A malicious user demoted for policy violations attempts to delete or modify records in the activity log table to hide their actions.
*   **Mitigation Strategy**:
    *   **Read-Only Ledger**: The `activity_logs` table has no corresponding update or delete routes in the API.
    *   **Database Triggers**: Database-level triggers block update and delete statements on the logs table:
        ```sql
        CREATE RULE no_updates AS ON UPDATE TO activity_logs DO INSTEAD NOTHING;
        CREATE RULE no_deletes AS ON DELETE TO activity_logs DO INSTEAD NOTHING;
        ```

---

### 1.7 Malicious File Uploads (Web Shells)
*   **Attack Scenario**: An attacker uploads a PHP script disguised as an invoice file, attempting to execute arbitrary code on the server.
*   **Mitigation Strategy**:
    *   **Type Validation**: The server validates the MIME type and extension of all uploaded files, restricting uploads to safe formats (e.g., PDF, PNG, JPG).
    *   **Isolated Storage**: Files are saved in an isolated storage bucket (e.g., AWS S3 or Render disk) with execution permissions disabled.
    *   **Filename Sanitization**: Uploaded files are renamed using UUIDs to prevent directory traversal attacks (e.g., uploading to `../../etc/passwd`).

---

### 1.8 API Denial of Service (DoS)
*   **Attack Scenario**: An attacker spams the API endpoints with requests to exhaust server resources.
*   **Mitigation Strategy**:
    *   **Rate Limiting**: FastAPI rate-limiting middleware restricts requests based on IP address and user ID (e.g., max 100 requests per minute).
    *   **Cloudflare Protection**: Cloudflare DNS manages incoming traffic, blocking automated botnets and distributed attacks.
