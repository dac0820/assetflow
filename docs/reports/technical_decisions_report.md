# Technical Decisions Report: AssetFlow ERP

This report documents the **Architectural Decision Records (ADRs)** for the key technical choices in **AssetFlow ERP**. These records provide context on the constraints, alternatives, and long-term implications of our design decisions.

---

## ADR 1: FastAPI for Backend REST APIs

### Status
Accepted

### Context
We need a backend framework that is highly performant, type-safe, and supports rapid development with auto-generated API specifications. The framework must handle both synchronous database queries and asynchronous network interactions.

### Alternatives Considered
-   **Django**: Too heavy; the built-in ORM is not natively async-first, and templating is unnecessary for a modern decoupled SPA architecture.
-   **Express.js (Node.js)**: High performance, but lacks built-in data validation tools comparable to Pydantic, and does not automatically output OpenAPI specs.

### Decision
FastAPI with Python 3.11 and Pydantic v2.

### Consequences
-   **Pros**: Fast developer validation using Pydantic, instant Swagger UI endpoint documentation, and high asynchronous performance.
-   **Cons**: Requires manual structure setup, which we resolve by implementing a strict Repository-Service layer pattern.

---

## ADR 2: Vite SPA over Next.js SSR

### Status
Accepted

### Context
We need to select a React build and rendering workflow for our user interface.

### Alternatives Considered
-   **Next.js (App Router / SSR)**: Next.js is ideal for public, content-heavy websites that require Search Engine Optimization (SEO). However, an internal ERP system is private, highly interactive, and contains no public pages. SSR increases server hosting costs and complexity without adding business value.

### Decision
**Vite Single-Page Application (SPA)** with client-side routing.

### Consequences
-   **Pros**: The build results in static asset files that can be hosted on a global CDN, reducing costs and providing fast page transitions.
-   **Cons**: Initial load requires fetching the full JS/CSS bundle. We mitigate this using lazy-route splitting to keep chunk sizes low.

---

## ADR 3: Relational PostgreSQL over Document NoSQL (MongoDB)

### Status
Accepted

### Context
We need a data store that guarantees absolute reliability for financial depreciation logs and asset inventories.

### Alternatives Considered
-   **MongoDB**: Excellent for rapid development of unstructured data, but lacks relational integrity checks (e.g., cascading deletes, foreign keys) and strict multi-table transactions. This increases the risk of orphan records during complex asset transfers.

### Decision
Managed **PostgreSQL** on Render.

### Consequences
-   **Pros**: Full ACID compliance, strong foreign key constraints, and advanced SQL features like window functions. Support for the JSONB data type allows storing semi-structured asset metadata alongside structured schemas.
-   **Cons**: Schema migrations are required when tables change. We manage this systematically using Alembic versions.
