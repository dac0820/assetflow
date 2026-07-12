# PostgreSQL Query Optimization: AssetFlow ERP

This document outlines the indexing, table partitioning, materialized views, and query optimization strategies for **AssetFlow ERP**.

---

## 1. Indexing Strategy

We use indexes to maintain sub-millisecond response times for common queries as data volume grows.

### 1.1 Partial Indexes
To reduce index size and improve search performance, indexes exclude archived or deleted records:
```sql
CREATE INDEX idx_active_assets_serial 
ON assets (serial_number) 
WHERE is_deleted = FALSE;
```
*   **Rationale**: Excluding retired assets reduces index size by up to 30%, keeping active searches fast.

### 1.2 Composite Indexes
Composite indexes are configured for queries that filter on multiple columns (e.g., historical depreciation checks):
```sql
CREATE INDEX idx_depreciations_asset_year 
ON depreciations (asset_id, fiscal_year);
```
*   **Rationale**: Prevents multi-column index scans by indexing the compound query parameters together.

### 1.3 JSONB Indexing (GIN Indexes)
Asset details can contain unstructured metadata stored in a JSONB column. We index this field using GIN:
```sql
CREATE INDEX idx_assets_metadata 
ON assets USING gin (metadata);
```
*   **Rationale**: Enables indexing of nested fields, supporting fast queries on custom attributes.

---

## 2. Table Partitioning (Time-Based)

High-volume tables like `activity_logs` and `depreciations` are partitioned by year to prevent queries from scanning the entire dataset.

### Implementation Example: `activity_logs`
```sql
CREATE TABLE activity_logs (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
) PARTITION BY RANGE (created_at);

-- Generate Annual Partitions
CREATE TABLE activity_logs_y2026 PARTITION OF activity_logs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
```
*   **Rationale**: Queries searching for logs in the current fiscal year bypass older partitions, improving query performance.

---

## 3. Materialized Views

For complex dashboard aggregations (e.g., quarterly depreciation summaries and asset category counts):

```sql
CREATE MATERIALIZED VIEW mv_quarterly_valuation AS
SELECT 
    category_id,
    date_trunc('quarter', purchase_date) as quarter_period,
    sum(purchase_cost) as total_value,
    count(id) as asset_count
FROM assets
WHERE is_deleted = FALSE
GROUP BY category_id, quarter_period;

-- Index the Materialized View
CREATE UNIQUE INDEX idx_mv_quarterly_val ON mv_quarterly_valuation (category_id, quarter_period);
```
*   **Refresh Strategy**: The view is refreshed every 6 hours using a background Celery task:
    ```sql
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_quarterly_valuation;
    ```
