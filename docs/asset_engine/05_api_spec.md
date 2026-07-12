# REST API Specification: Asset Management Engine

This document contains the REST API specifications for the **Asset Management Engine** in **AssetFlow ERP**. All routes are versioned under `/api/v1`.

---

## 1. API Route Overview

| Method | Endpoint | Description | Auth Required | Permissions |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/assets` | Register a new asset | Yes | `asset:create` |
| **GET** | `/assets` | Query paginated list of assets | Yes | `asset:read` |
| **GET** | `/assets/{id}` | Retrieve details of a single asset | Yes | `asset:read` |
| **PATCH** | `/assets/{id}` | Update metadata or status of an asset | Yes | `asset:edit` |
| **DELETE** | `/assets/{id}` | Soft-delete / Archive an asset | Yes | `asset:delete` |
| **POST** | `/assets/bulk-update` | Apply status or location changes in bulk | Yes | `asset:edit` |
| **POST** | `/assets/bulk-delete` | Archive multiple assets | Yes | `asset:delete` |
| **GET** | `/assets/{id}/history` | Retrieve asset transfer and allocation logs | Yes | `asset:read` |
| **POST** | `/assets/{id}/documents` | Upload PDF invoice or warranty agreement | Yes | `asset:edit` |

---

## 2. API Endpoint Contracts

---

### 2.1 `POST /assets`
*   **Request Payload**:
    ```json
    {
      "name": "MacBook Pro 16",
      "serial_number": "SN-MBP-9021",
      "category_id": "f5127efd-9cf3-4011-beab-2251a8f9024f",
      "purchase_cost": 2499.00,
      "purchase_date": "2026-07-01",
      "salvage_value": 300.00,
      "useful_life_years": 4,
      "location_id": "84cb020d-7cae-4f01-be0a-c21ea7f123ff"
    }
    ```
*   **Response Payload (211 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
        "status": "available",
        "created_at": "2026-07-12T10:30:00Z"
      }
    }
    ```
*   **Error Responses**:
    *   `409 Conflict`: Serial number is already registered.
    *   `422 Unprocessable Entity`: Validation failed (e.g., salvage value exceeds cost).

---

### 2.2 `POST /assets/bulk-update`
*   **Request Payload**:
    ```json
    {
      "asset_ids": [
        "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
        "d2a60fae-e2c7-4ebc-8854-3252199b0c21"
      ],
      "updates": {
        "status": "maintenance",
        "location_id": "99ea020d-7cae-4f01-be0a-c21ea7f123aa"
      }
    }
    ```
*   **Response Payload (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "updated_count": 2,
        "failed_asset_ids": []
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid status or location ID.

---

### 2.3 `GET /assets/{id}/history`
*   **Response Payload (200 OK)**:
    ```json
    {
      "asset_id": "c1a60fae-e2c7-4ebc-8854-3252199b0c20",
      "history": [
        {
          "event_type": "allocation",
          "action": "allocated",
          "performed_by": "John Doe (Manager)",
          "timestamp": "2026-07-02T14:30:00Z",
          "notes": "Assigned to software engineering team."
        },
        {
          "event_type": "transfer",
          "action": "location_changed",
          "performed_by": "System Agent",
          "timestamp": "2026-07-05T09:00:00Z",
          "notes": "Moved from Warehouse A to HQ Office."
        }
      ]
    }
    ```
