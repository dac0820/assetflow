# Engineering Task List: AssetFlow ERP

This document contains detailed engineering task cards for the implementation of **AssetFlow ERP**. Each card serves as a specification for the development team.

---

## 1. Authentication & Security Tasks

---

### Task ID: `TSK-ATH-01`
*   **Title**: Implement JWT Access Token and HttpOnly Refresh Cookie Flow
*   **Objective**: Build a stateless session manager that returns a short-lived access token in the response and sets a secure refresh token in a cookie.
*   **Inputs**:
    *   `POST /api/v1/auth/login` payload: `{ email, password }`
    *   System Environment variables: `JWT_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
*   **Outputs**:
    *   JSON response: `{ access_token, token_type: "bearer", expires_in }`
    *   Set-Cookie Header: `Refresh_Token=<string>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
*   **Acceptance Criteria**:
    1.  Access tokens must expire after 15 minutes.
    2.  Refresh tokens must be stored as hashed values in the database.
    3.  Cookie flags must be set to `HttpOnly`, `Secure`, and `SameSite=Strict`.
*   **Definition of Done**:
    *   FastAPI endpoint checks pass.
    *   Unit tests cover token creation, expiration, and invalidation.
    *   Security checks verify cookie headers.
*   **Risks & Edge Cases**: If the cookie is intercepted or sent over HTTP, credentials could be compromised. (Mitigation: Enforce HTTPS at the proxy layer).

---

### Task ID: `TSK-ATH-02`
*   **Title**: Integrate Role-Based Access Control (RBAC) Route Guards
*   **Objective**: Build reusable FastAPI dependencies to block unauthorized requests based on user roles and permissions.
*   **Inputs**:
    *   HTTP request header: `Authorization: Bearer <Token>`
    *   Allowed roles parameter: `allowed_roles: list[str]` (e.g., `["admin", "manager"]`).
*   **Outputs**:
    *   Injected `current_user` object for authorized requests.
    *   `HTTP 403 Forbidden` error response for unauthorized requests.
*   **Acceptance Criteria**:
    1.  Users without the required role must be blocked at the route gateway.
    2.  Token expiration checks must run before role validation.
*   **Definition of Done**:
    *   RBAC middleware is registered.
    *   Integration tests verify access control blocks for each role.

---

## 2. Asset & Inventory Tasks

---

### Task ID: `TSK-AST-01`
*   **Title**: Implement Asset Registration with Serial Number Uniqueness Check
*   **Objective**: Build the backend endpoint and database checks to register new physical assets.
*   **Inputs**:
    *   `POST /api/v1/assets/` payload: `AssetName`, `SerialNumber`, `PurchaseCost`, `Category`, `Location`.
*   **Outputs**:
    *   Saved row in the `assets` table.
    *   JSON response: `{ id, status: "available" }`
*   **Acceptance Criteria**:
    1.  The database unique constraint must prevent duplicate serial numbers.
    2.  `purchase_cost` must be > 0.00.
    3.  `salvage_value` must be <= `purchase_cost`.
*   **Definition of Done**:
    *   API endpoint is documented in Swagger.
    *   Integration tests verify validation constraints and duplicate entry blocks.

---

## 3. Financial & Calculations Tasks

---

### Task ID: `TSK-FIN-01`
*   **Title**: Calculate Depreciation Schedules (Straight-Line & Double Declining)
*   **Objective**: Implement calculation methods to compute annual depreciation schedules.
*   **Inputs**:
    *   Asset record parameters: `purchase_cost`, `salvage_value`, `useful_life_years`, `depreciation_method`.
*   **Outputs**:
    *   Array of depreciation records: `[{ fiscal_year, beginning_value, depreciation_amount, ending_value }]`
*   **Acceptance Criteria**:
    1.  Straight-Line formula: `(Cost - Salvage) / Useful Life`.
    2.  Double Declining formula: `Beginning Value * (2 / Useful Life)`.
    3.  Calculated asset value must not drop below the salvage value.
*   **Definition of Done**:
    *   Unit tests cover calculations for edge cases (e.g., zero salvage value).
    *   100% test coverage on depreciation formulas.
