# Technology Decisions: AssetFlow ERP

This report details the architectural and technological choices made for **AssetFlow ERP**, including comparisons, advantages, disadvantages, and mitigation strategies for selected risks.

---

## 1. Backend Stack Decisions

### 1.1 Core Framework: FastAPI (Python)
We selected **FastAPI** over Django, Flask, and Express.js (Node.js).

*   **Rationale**:
    *   **High Performance**: Built on top of Starlette and Pydantic, making it one of the fastest Python frameworks available, matching Node.js speed.
    *   **Automatic OpenAPI Docs**: Generates Interactive API documentation (Swagger UI & ReDoc) automatically from Pydantic schemas, reducing friction between frontend and backend teams.
    *   **Type Safety**: Heavily leverages Python 3.10+ type hints, reducing bugs and boosting developer IDE completion.
    *   **Asynchronous Native**: Supports native async/await syntax, ideal for non-blocking I/O operations like connecting to the DB or external APIs.

| Metric / Feature | FastAPI | Django | Express.js |
| :--- | :--- | :--- | :--- |
| **Speed** | Extremely High (ASGI) | Medium (WSGI) | High (Event Loop) |
| **Validation** | Built-in (Pydantic) | Manual / Forms | Third-party (Joi/Zod) |
| **ORM** | Flexible (SQLAlchemy) | Django ORM | Flexible (Prisma/TypeORM) |
| **Doc Gen** | Automatic (OpenAPI) | Third-party packages | Manual Swagger setup |

*   **Disadvantage**: FastAPI provides less out-of-the-box structure than Django (which has an Admin panel and built-in RBAC).
*   **Mitigation**: We will construct an explicit repository-service layer pattern and utilize SQLAlchemy to handle structured permissions.

### 1.2 Object-Relational Mapper (ORM): SQLAlchemy
*   **Rationale**: The industry-standard Python toolkit. Offers Enterprise-ready patterns (Identity Map, Unit of Work, Lazy/Eager loading optimizations) essential for handling complex relational assets.
*   **Alembic Integration**: Alembic provides database migrations, allowing schema changes to be versioned alongside code.

---

## 2. Database Stack Decisions

### 2.1 Database Management System: PostgreSQL
*   **Rationale**:
    *   **ACID Compliance**: Crucial for ERP applications where financial depreciation calculations and asset valuations must be highly consistent.
    *   **Advanced Indexing**: Supports B-Tree, GIN, and GiST indexes, enabling sub-millisecond querying on large asset registers.
    *   **JSONB Support**: Allows storage of unstructured asset metadata (e.g., custom attributes for specific asset classes like IT hardware vs heavy machinery) while maintaining full indexing capability.
    *   **Render Compatibility**: Easily scalable to enterprise levels using Render's managed PostgreSQL.

*   **Alternatives Evaluated**:
    *   **MongoDB**: Ruled out due to lack of strong relational constraints (foreign keys) and transaction safeguards, which are vital for an ERP audit log.
    *   **MySQL**: Ruled out due to PostgreSQL's superior support for advanced features like JSONB and window functions for analytical reports.

---

## 3. Frontend Stack Decisions

### 3.1 Framework: React.js with Vite
*   **Rationale**:
    *   **Vite**: Offers instantaneous Hot Module Replacement (HMR) and ultra-fast ESbuild compiling, drastically improving developer efficiency compared to Webpack/Create React App.
    *   **React + TypeScript**: Provides strict typing for complex forms, tables, and states (e.g., asset depreciation schedules, audit checklists).
    *   **Single-Page Application (SPA)**: Since AssetFlow is a highly interactive internal ERP system, a Vite SPA is preferred over Next.js (SSR/SSG) as it minimizes server load and yields instant client-side transitions.

### 3.2 UI System: TailwindCSS & shadcn/ui
*   **Rationale**:
    *   **TailwindCSS**: Utilty-first CSS library allowing rapid UI building and standardizing clean styling variables (spacing, colors, responsive breakpoints).
    *   **shadcn/ui**: Combines Radix UI (accessible, unstyled primitives) with Tailwind CSS. It is copied directly into the codebase instead of being imported as an immutable npm dependency, allowing total customization of high-tier components like Data Tables, Dialogs, and Selectors.

---

## 4. Message Broker & Background Tasks: Redis & Celery

*   **Rationale**:
    *   **Celery**: The standard Python framework for distributed task queues. Handles long-running operations (depreciation recalculations, PDF generation, bulk email audits).
    *   **Redis**: In-memory data store used as the messaging broker for Celery and as a cache for expensive dashboard statistics (e.g., asset health rates, depreciation charts).
