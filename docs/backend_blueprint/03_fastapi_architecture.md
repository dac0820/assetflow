# FastAPI Architecture Blueprint: AssetFlow ERP

This document maps out the directory layout, layer responsibilities, and coding conventions for the **AssetFlow ERP** backend built on FastAPI.

---

## 1. Directory Structure

The backend codebase is structured into functional layers, maintaining separation of concerns and testability.

```
backend/
├── alembic/                    # Database migration scripts and settings
│   ├── env.py                  # Alembic environment configuration
│   └── versions/               # Individual migration versions
├── alembic.ini                 # Alembic initialization configuration
├── requirements.txt            # Python package dependencies
├── run.py                      # Main entrypoint to run the Uvicorn server
└── app/
    ├── __init__.py
    ├── main.py                 # FastAPI application setup
    ├── api/                    # Delivery Layer: Routing endpoints
    │   ├── v1/                 # API Version 1 Routers
    │   │   ├── auth.py
    │   │   ├── assets.py
    │   │   ├── finance.py
    │   │   └── audits.py
    │   └── dependencies/       # Shared FastAPI route dependencies
    │       ├── db.py           # Database session yield
    │       └── security.py     # JWT validation and Role check classes
    ├── core/                   # System Configuration Core
    │   ├── config.py           # Configuration parser (Pydantic Settings)
    │   ├── database.py         # SQLAlchemy engine and session makers
    │   ├── security.py         # Password cryptography helpers
    │   └── middlewares/        # Global CORS and logging middlewares
    ├── models/                 # Database Layer: SQLAlchemy Models
    │   ├── base.py             # Declares declarative base
    │   ├── user.py
    │   ├── asset.py
    │   ├── finance.py
    │   └── audit.py
    ├── schemas/                # Validation Layer: Pydantic schemas
    │   ├── user.py
    │   ├── asset.py
    │   ├── finance.py
    │   └── audit.py
    ├── repositories/           # Data Access Layer: SQLAlchemy CRUD operations
    │   ├── base.py             # Generic CRUD Base repository
    │   ├── user.py
    │   ├── asset.py
    │   └── finance.py
    ├── services/               # Business Logic Layer: Core calculations
    │   ├── auth.py
    │   ├── asset.py
    │   ├── finance.py          # Depreciation calculations
    │   └── audit.py
    ├── workers/                # Background Task Layer: Celery tasks
    │   ├── main.py             # Celery app initialization
    │   └── tasks/              # Background jobs (depreciation, emails)
    │       ├── finance.py
    │       └── mailer.py
    └── tests/                  # Test Suite
        ├── conftest.py         # Pytest test fixtures
        ├── unit/               # Unit testing scripts
        └── integration/        # Integration testing scripts
```

---

## 2. Directory Responsibilities

### 2.1 API Route Layer (`app/api/`)
*   **Responsibility**: Defines HTTP endpoints and manages requests and responses.
*   **Constraints**: Contains no business logic or raw SQL queries. Routers validate inputs using Pydantic schemas, call the appropriate Service layer, and return HTTP status codes.

### 2.2 Business Logic Layer (`app/services/`)
*   **Responsibility**: Core business rules and validation. Handles actions like calculating depreciation schedules, checking transfer eligibility, and coordinating multiple updates.
*   **Constraints**: Services are decoupled from HTTP request frameworks, allowing them to be run by background workers or CLI scripts.

### 2.3 Data Access Layer (`app/repositories/`)
*   **Responsibility**: Database communication. Writes SQL queries and performs insert, update, and search operations.
*   **Constraints**: Only the repository layer interacts with SQLAlchemy session objects, abstracting database access from the service layer.

### 2.4 Models Layer (`app/models/`)
*   **Responsibility**: Defines the database schema using SQLAlchemy ORM objects.

### 2.5 Schemas Layer (`app/schemas/`)
*   **Responsibility**: Data validation and serialization using Pydantic. Defines how data is received (Request) and returned (Response) by the API.

---

## 3. Dependency Flow Rules

To keep the codebase maintainable, dependency flows must follow a strict one-way path:

```
[Client Request] ──> [API Router] ──> [Service] ──> [Repository] ──> [Database]
```

*   **Rule 1: No Circular Imports**. A repository cannot import a service. A service cannot import a router.
*   **Rule 2: Router Dependency Injection**. Services are injected into routers using FastAPI's dependency system (`Depends`).
*   **Rule 3: Unit of Work**. Services manage database transactions, ensuring multi-table updates succeed or fail together.
