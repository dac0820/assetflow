# Asset Engine Architecture: AssetFlow ERP

This document outlines the software architecture, layered boundaries, and directory layout of the **Asset Management Engine** in **AssetFlow ERP**.

---

## 1. System Component Layers

The engine separates presentation, logic, database access, and schema structures to manage complexity and support scaling:

```
[React Frontend] (Components, pages, local stores)
       │
       ▼ (REST API requests validated via Pydantic)
[FastAPI Router Layer] (Validates inputs, sets status codes)
       │
       ▼
[Asset Service Layer] (Applies lifecycle rules, triggers transactions)
       │
       ▼
[Asset Repository Layer] (Prepares database queries, filters parameters)
       │
       ▼
[PostgreSQL Database] (Performs transactions, index checks)
```

---

## 2. Directory Layout & Module Boundaries

---

### 2.1 Backend Structure (`backend/app/modules/assets/`)
*   **`models.py`**: Declares SQLAlchemy models mapping fields like `serial_number`, `purchase_cost`, `salvage_value`, and the `version_number` (optimistic concurrency).
*   **`schemas.py`**: Defines Pydantic validation schemas (e.g., `AssetCreate`, `AssetUpdate`, `AssetResponse`) to validate data formats (e.g., checking that purchase cost is positive).
*   **`repositories.py`**: Handles database interactions (SQL queries, joins with categories/locations) using SQLAlchemy session objects.
*   **`services.py`**: Applies business rules and validates lifecycle transitions (e.g., checking that retired assets cannot be assigned to employees).
*   **`router.py`**: Exposes REST API endpoints and handles HTTP status codes.

---

### 2.2 Frontend Structure (`frontend/src/features/assets/`)
*   **`components/`**: Reusable component views:
    *   `AssetCard.tsx`: Grid view component displaying asset status, location, and condition.
    *   `AssetTable.tsx`: Virtualized list table displaying search results.
    *   `AssetForm.tsx`: Standard form layout for registrations.
    *   `QRScanner.tsx`: Scanner component that calls device cameras.
*   **`hooks/`**: Custom hooks (e.g., `useAssetSearch`, `useAssetDetails`).
*   **`stores/`**: Zustand state stores (e.g., `assetStore.ts`) managing UI states and filters.

---

## 3. Communication Contracts

*   **API Format**: JSON requests and responses.
*   **Data Validation**: Pydantic schemas validate input types, length limits, and formats before queries reach the database layer.
*   **Error Handling**: Domain errors are caught in global middleware and returned as standard JSON errors with clear codes:
    ```json
    {
      "status": "error",
      "error": {
        "code": "ILLEGAL_LIFECYCLE_TRANSITION",
        "message": "Cannot allocate asset: Current status is 'maintenance'."
      }
    }
    ```
