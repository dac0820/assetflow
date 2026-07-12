# Security Review & Testing Strategy: AssetFlow ERP

This report outlines the threat mitigation strategies, security test suites, and penetration testing checklists for the **AssetFlow ERP** platform.

---

## 1. Threat Mitigation Matrix

We address 17 primary threat vectors at both the application and database layers:

### 1.1 Credential Stuffing & Password Spraying
*   **Threat**: Attackers attempt to log in using database dumps of leaked credentials from other websites, or check common passwords across multiple accounts.
*   **Mitigation**: 
    *   Enforce a strong password policy (minimum length: 12 characters, uppercase/lowercase, numbers, special characters).
    *   Enforce account lockouts after 5 consecutive failed login attempts.
    *   Implement IP-based rate limiting on the `/login` route.

### 1.2 Session Hijacking & Token Theft
*   **Threat**: Attackers attempt to steal active access tokens or session cookies to access user accounts.
*   **Mitigation**:
    *   Access tokens are stored strictly in application memory (Zustand state) and are never saved to persistent storage.
    *   Refresh tokens are stored in secure cookies (`HttpOnly`, `Secure`, `SameSite=Strict`), protecting them from access via JavaScript (XSS) or cross-site request forgery (CSRF).

### 1.3 Privilege Escalation & IDOR
*   **Threat**: A user demoted to "Viewer" intercepts API requests and injects admin roles or modifies path IDs to access unauthorized data.
*   **Mitigation**:
    *   The backend validates permissions on every request using router guards.
    *   The database filters queries based on the requesting user's department ID, blocking unauthorized access.

### 1.4 Clickjacking & File Upload Abuse
*   **Threat**: Attackers embed the application inside an iframe to hijack user clicks, or upload malicious files to execute arbitrary code.
*   **Mitigation**:
    *   Use the `X-Frame-Options: DENY` HTTP header to prevent the application from being rendered in an iframe.
    *   Upload validation rules check file MIME types and extensions, and rename files to UUIDs, storing them in isolated buckets with execute permissions disabled.

### 1.5 Timing Attacks
*   **Threat**: Attackers analyze server response times to identify valid email addresses or match password structures.
*   **Mitigation**: Use a constant-time comparison algorithm (e.g., `hmac.compare_digest`) for token checks and password verifications to prevent timing-based analysis.

---

## 2. Security Testing Strategy

```
           [CI/CD Security Verification]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   [Unit Tests]     [API Tests]      [SAST Scans]
   - Hashing speed  - Route guards   - Bandit checks
   - Token formats  - 401/403 blocks - Dependency scans
```

### 2.1 API Route Guard Tests
*   **Scope**: Verifies validation parameters, HTTP status codes, and access blocks.
*   **Test Cases**:
    *   Confirm that a user without the `asset:create` permission receives a `403 Forbidden` error when calling `POST /api/v1/assets/`.
    *   Confirm that invalid access tokens are rejected with an `HTTP 401 Unauthorized` response.

### 2.2 Security Tool Scans (SAST)
*   **Scope**: Static Application Security Testing (SAST) to identify vulnerabilities in code and dependencies.
*   **Tools**:
    *   **Bandit**: Scans the Python backend for security flaws (e.g., weak encryption algorithms, hardcoded secrets).
    *   **npm audit / pip list --outdated**: Automated dependency audits during the build phase.

---

## 3. Penetration Testing Checklist

Before production release, the application is subjected to manual penetration testing:

-   [ ] **JWT Verification**: Test if modifying the payload or signature of a JWT token allows bypassing authentication.
-   [ ] **RTR Validation**: Attempt to replay a used refresh token to verify if the breach detection system invalidates the user's active sessions.
-   [ ] **Rate Limit Override**: Attempt to send 50 requests per second to the `/login` route using multiple IP addresses to test rate limit blocks.
-   [ ] **IDOR Check**: Modify ID parameters in `/api/v1/assets/{id}` requests using a viewer account to verify access control blocks.
-   [ ] **XSS Script Injection**: Inject script tags (`<script>alert(1)</script>`) in text inputs to verify HTML escaping and rendering.
