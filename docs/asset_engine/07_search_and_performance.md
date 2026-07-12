# Search Engine & Performance: Asset Management Engine

This document specifies the search engine architecture, query optimization plans, and performance tuning rules for the **Asset Management Engine**.

---

## 1. Search Engine Design & Indexing

To support fast queries across millions of records, AssetFlow implements a multi-tiered search index strategy in PostgreSQL:

### 1.1 Full-Text Search (FTS)
*   **Target**: Search queries matching terms inside asset names, descriptions, or notes fields.
*   **Implementation**: PostgreSQL `tsvector` columns and `GIN` indexes. We generate a search vector column on the `assets` table:
    ```sql
    ALTER TABLE assets ADD COLUMN search_vector tsvector;
    CREATE INDEX idx_assets_search_vector ON assets USING gin(search_vector);
    ```
*   **Trigger**: A database trigger automatically updates `search_vector` when the `name` or `description` fields change.

### 1.2 GIN Indexing on Custom Metadata
*   **Target**: Querying custom JSONB metadata key-value pairs (e.g., searching for laptops with `{"ram_size": "16GB"}`).
*   **Implementation**: GIN indexing on the `custom_metadata` column:
    ```sql
    CREATE INDEX idx_assets_custom_metadata ON assets USING gin (custom_metadata);
    ```
*   **Query Example**:
    ```sql
    SELECT * FROM assets WHERE custom_metadata @> '{"ram_size": "16GB"}';
    ```

---

## 2. Cursor-Based Pagination

To maintain stable query response times as database table sizes exceed 1 million rows, the API uses **Cursor-Based Pagination** instead of standard offset pagination.

*   **Problem**: Using `OFFSET 1000000 LIMIT 50` forces PostgreSQL to read and discard 1 million rows, increasing response times.
*   **Solution**: Queries use a cursor based on the last row's ID and timestamp:
    ```sql
    SELECT * FROM assets 
    WHERE (purchase_date, id) < (:last_purchase_date, :last_id) 
    ORDER BY purchase_date DESC, id DESC 
    LIMIT 50;
    ```
*   **Benefit**: Query execution times remain stable, regardless of page depth.

---

## 3. Performance Tuning Strategies

### 3.1 Redis Caching
*   **Asset Details Cache**: Fetching an asset's details (`GET /api/v1/assets/{id}`) queries Redis first. If a cache miss occurs, the data is fetched from PostgreSQL and cached in Redis for **30 minutes**.
*   **Invalidation**: Updates to an asset's metadata or status automatically clear its corresponding Redis cache keys.

### 3.2 Client-Side Image Compression
*   **Problem**: Uploading raw 5MB-10MB reference photos from mobile cameras consumes bandwidth and storage space.
*   **Solution**: Before uploading, the React app compresses the image to a maximum resolution of **1200px** wide using HTML5 Canvas adjustments, keeping file sizes under 200KB.
