# Performance & Testing Blueprint: AssetFlow ERP

This document contains the performance engineering designs and testing blueprints for the **AssetFlow ERP** backend.

---

## 1. Performance Engineering Strategy

To support high concurrent user traffic and millions of registered assets:

### 1.1 Query Optimization & N+1 Prevention
*   **Problem**: Fetching assets and joining categories sequentially can result in separate database queries for each row, leading to high latency.
*   **Solution**: In the repository layer, all queries that access related data use SQLAlchemy's `joinedload` (e.g., `options(joinedload(Asset.category))`). This loads the related tables in a single SQL join query.

### 1.2 Redis Caching Strategy
*   **Static Configs**: Cache system configurations (the `settings` table) and locations in Redis indefinitely. Evict the cache when an update occurs.
*   **Dashboard Aggregations**: Cache dashboard metrics (total asset value, depreciation totals) for **15 minutes**.

### 1.3 Asynchronous Queue Processing (Celery & Redis)
*   **Depreciation Calculations**: Finance run requests trigger a Celery task, returning an `HTTP 202 Accepted` status to the client and running calculations in the background.
*   **Notifications**: Email dispatches are queued in Celery to prevent external email server delays from blocking HTTP API requests.

### 1.4 Large Dataset Handling & Batch Processing
*   **Batching**: Tasks that update database rows (like depreciation calculations) process records in batches of **500 items** using database transactions to avoid locking tables.
*   **Pagination**: High-volume tables use cursor-based pagination (using the asset UUID or created timestamp) instead of offset-based pagination to maintain stable query response times.

---

## 2. Testing Blueprint

AssetFlow implements a multi-tier testing framework to ensure code quality and stability.

```
                  [CI/CD Quality Gate]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  [Unit Tests]     [Integration Tests]     [Load Tests]
  - Math formulas   - Repository SQL        - Locust profiles
  - Schema formats  - Router RBAC blocks    - Concurrent queries
```

### 2.1 Unit Testing (pytest)
*   **Scope**: Math calculations, token serialization, and config loading.
*   **Target**: 100% test coverage on straight-line and double-declining depreciation formulas.

### 2.2 Integration Testing
*   **Scope**: Database access, repository queries, and router endpoint parameters.
*   **Setup**: Run tests against an in-memory SQLite database or a test PostgreSQL instance.
*   **Execution**:
    ```bash
    pytest tests/integration/
    ```

### 2.3 API Validation & Security Checks
*   **Scope**: Verifies validation parameters, HTTP status codes, and RBAC error blocks.
*   **Test Cases**:
    *   Confirm that a user with the "Viewer" role receives a `403 Forbidden` error when calling `POST /api/v1/assets/`.
    *   Confirm that invalid serial numbers trigger a `422 Unprocessable Entity` validation error.

### 2.4 Load Testing (Locust)
*   **Scope**: Simulates concurrent user actions to check system performance.
*   **Target**: Enforce API response times under **100ms** at **1,000 concurrent requests per second**.
