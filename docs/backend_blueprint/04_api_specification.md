# REST API Specification: AssetFlow ERP

This document outlines the API contracts, request payloads, response schemas, validations, and permission scopes for the **AssetFlow ERP** platform. All routes are versioned under `/api/v1`.

---

## 1. Authentication & Session Module (`/api/v1/auth`)

---

### 1.1 `POST /login`
*   **Purpose**: Authenticate credentials and return an access token and refresh cookie.
*   **Request Schema**:
    ```json
    {
      "email": "user@company.com",
      "password": "SecurePassword123"
    }
    ```
*   **Response Schema (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "expires_in": 900
    }
    ```
*   **Validation Rules**: 
    *   `email` must be a valid email format.
    *   `password` cannot be empty.
*   **Permissions Required**: None (Public).
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid email or password.
    *   `423 Locked`: Account locked due to too many failed attempts.

---

### 1.2 `POST /refresh`
*   **Purpose**: Exchange a valid refresh cookie for a new access token.
*   **Request Schema**: Empty body (reads Refresh Token cookie).
*   **Response Schema (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "expires_in": 900
    }
    ```
*   **Permissions Required**: None (Public).
*   **Error Responses**:
    *   `401 Unauthorized`: Stale or revoked refresh token.

---

## 2. Asset Catalog Module (`/api/v1/assets`)

---

### 2.1 `GET /`
*   **Purpose**: Retrieve a paginated list of assets using search filters.
*   **Query Parameters**:
    *   `page`: Integer (Default: 1)
    *   `size`: Integer (Default: 20, Max: 100)
    *   `q`: String (Search asset name or serial number)
    *   `category_id`: UUID (Filter by category)
    *   `location_id`: UUID (Filter by location)
    *   `status`: String (Filter by status: available, allocated, maintenance, retired)
    *   `sort_by`: String (purchase_date, purchase_cost; Default: purchase_date)
    *   `order`: String (asc, desc; Default: desc)
*   **Response Schema (200 OK)**:
    ```json
    {
      "items": [
        {
          "id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
          "name": "Production Server Blade",
          "serial_number": "SN-SRV-901",
          "purchase_cost": 4500.00,
          "status": "available",
          "condition": "excellent",
          "location_id": "84cb020d-7cae-4f01-be0a-c21ea7f123ff"
        }
      ],
      "total": 1,
      "page": 1,
      "size": 20,
      "pages": 1
    }
    ```
*   **Permissions Required**: `asset:read`.

---

### 2.2 `POST /`
*   **Purpose**: Register a new physical asset.
*   **Request Schema**:
    ```json
    {
      "name": "Production Server Blade",
      "serial_number": "SN-SRV-901",
      "category_id": "f5127efd-9cf3-4011-beab-2251a8f9024f",
      "purchase_cost": 4500.00,
      "purchase_date": "2026-07-01",
      "salvage_value": 500.00,
      "useful_life_years": 5,
      "location_id": "84cb020d-7cae-4f01-be0a-c21ea7f123ff"
    }
    ```
*   **Response Schema (211 Created)**:
    ```json
    {
      "id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
      "status": "available"
    }
    ```
*   **Validation Rules**:
    *   `purchase_cost` must be > 0.00.
    *   `useful_life_years` must be >= 1.
    *   `salvage_value` must be <= `purchase_cost`.
*   **Permissions Required**: `asset:create`.
*   **Error Responses**:
    *   `409 Conflict`: Serial number is already registered.

---

### 2.3 `PATCH /{id}`
*   **Purpose**: Perform a partial update of an asset record.
*   **Request Schema**:
    ```json
    {
      "name": "Updated Server Blade Name",
      "condition": "good",
      "version": 1
    }
    ```
*   **Response Schema (200 OK)**:
    ```json
    {
      "id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
      "version": 2
    }
    ```
*   **Permissions Required**: `asset:edit`.
*   **Error Responses**:
    *   `409 Conflict`: Version mismatch (Optimistic lock conflict).
    *   `404 Not Found`: Asset ID does not exist.

---

## 3. Financial Module (`/api/v1/finance`)

---

### 3.1 `GET /depreciation/{asset_id}`
*   **Purpose**: Get the calculated and projected depreciation schedules for an asset.
*   **Response Schema (200 OK)**:
    ```json
    {
      "asset_id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
      "depreciation_method": "straight_line",
      "schedule": [
        {
          "fiscal_year": 2026,
          "beginning_value": 4500.00,
          "depreciation_amount": 800.00,
          "ending_value": 3700.00
        }
      ]
    }
    ```
*   **Permissions Required**: `finance:read`.

---

### 3.2 `POST /depreciation/calculate`
*   **Purpose**: Trigger a depreciation calculation run for all eligible assets.
*   **Request Schema**:
    ```json
    {
      "fiscal_year": 2026
    }
    ```
*   **Response Schema (202 Accepted)**:
    ```json
    {
      "task_id": "celery-job-uuid-1234",
      "status": "processing"
    }
    ```
*   **Permissions Required**: `finance:calculate`.

---

## 4. Audits & Compliance Module (`/api/v1/audits`)

---

### 4.1 `POST /verify`
*   **Purpose**: Submit audit scan results for a specific asset.
*   **Request Schema**:
    ```json
    {
      "cycle_id": "e2ba9b21-4ea2-4e08-bf12-42171c69a102",
      "asset_id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
      "verified_condition": "excellent",
      "is_present": true
    }
    ```
*   **Response Schema (200 OK)**:
    ```json
    {
      "status": "verified",
      "discrepancy_created": false
    }
    ```
*   **Permissions Required**: `audit:execute`.
