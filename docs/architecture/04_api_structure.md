# API Structure: AssetFlow ERP

This document details the RESTful API structure, routing conventions, standard responses, and error codes for **AssetFlow ERP**. All APIs are versioned under `/api/v1`.

---

## 1. Global REST Conventions

1.  **Format**: All request and response bodies must be JSON.
2.  **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <JWT_TOKEN>` (for authenticated endpoints)
3.  **HTTP Verbs**:
    *   `GET`: Retrieve resources. Should not modify database state.
    *   `POST`: Create new resources or execute state transitions (e.g., `/transfer`).
    *   `PUT`: Update an existing resource by replacing it entirely.
    *   `PATCH`: Perform a partial update on a resource.
    *   `DELETE`: Delete or archive a resource.

---

## 2. API Endpoint Layout

### 2.1 Authentication & User Module (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/login` | Authenticate credentials and return JWT tokens | No |
| **POST** | `/refresh` | Exchange a valid refresh token for a new access token | No |
| **GET** | `/me` | Get the profile details of the currently logged-in user | Yes |
| **POST** | `/users` | Create a new user (Admin-only) | Yes |
| **PATCH** | `/users/{id}` | Update a user's role or details (Admin-only) | Yes |

### 2.2 Asset Module (`/api/v1/assets`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Query paginated list of assets with filters | Yes |
| **POST** | `/` | Create a new asset registry | Yes |
| **GET** | `/{id}` | Fetch detailed properties of a single asset | Yes |
| **PATCH** | `/{id}` | Update asset metadata or category | Yes |
| **DELETE** | `/{id}` | Archive / Retire an asset | Yes |
| **POST** | `/{id}/transfer` | Transfer asset ownership or location | Yes |

### 2.3 Finance & Depreciation Module (`/api/v1/finance`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/depreciation/{asset_id}` | Fetch current and projected depreciation schedule | Yes |
| **POST** | `/depreciation/calculate` | Trigger bulk calculation run for a specific date range | Yes |
| **GET** | `/valuation-summary` | Retrieve summary data for financial reporting dashboards | Yes |

### 2.4 Audit & Compliance Module (`/api/v1/audits`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Retrieve list of scheduled and completed audits | Yes |
| **POST** | `/` | Schedule a new asset audit | Yes |
| **POST** | `/{id}/verify` | Submit verification checklist and sign-off on an audit | Yes |

---

## 3. Standard Response Formats

### 3.1 Success Envelope
All success responses return standard JSON. GET lists are wrapped in a paginated envelope:
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid-v4-identifier",
        "name": "MacBook Pro 16",
        "serial_number": "MBP2026X91",
        "status": "active"
      }
    ],
    "total": 125,
    "page": 1,
    "size": 25,
    "pages": 5
  }
}
```

### 3.2 Error Envelope
When an operation fails, the server responds with a matching HTTP status code and a structured payload indicating the exact domain error:
```json
{
  "status": "error",
  "error": {
    "code": "ASSET_DEPRECIATION_ERROR",
    "message": "Cannot calculate depreciation: Asset salvage value exceeds original cost.",
    "details": {
      "asset_id": "uuid-v4-identifier",
      "original_cost": 1200.00,
      "salvage_value": 1500.00
    }
  }
}
```

---

## 4. Query Parameters: Filtering, Pagination, and Sorting

-   **Pagination**: Handled via `page` and `size` parameters. E.g., `GET /api/v1/assets?page=1&size=20`.
-   **Sorting**: Uses the format `sort_by=field` and `order=asc|desc`. E.g., `GET /api/v1/assets?sort_by=purchase_date&order=desc`.
-   **Filtering**: Direct query keys mapped to models. E.g., `GET /api/v1/assets?status=active&category_id=uuid`.
