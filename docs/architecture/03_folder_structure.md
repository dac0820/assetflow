# Project Folder Structure: AssetFlow ERP

This document outlines the standard enterprise layout for the **AssetFlow ERP** repository, ensuring separation of concern, code modularity, and microservice-readiness.

---

## 1. Directory Tree Overview

```
assetflow/
├── .env.example                # Local and server env variables templates
├── .gitignore                  # Git ignore definitions
├── README.md                   # Project developer documentation
├── docs/                       # Architecture and reports folder
│   ├── architecture/           # Core architectural deliverables
│   └── reports/                # Formal engineering/business reports
├── backend/                    # FastAPI backend codebase
│   ├── alembic/                # DB migration versions and env configuration
│   │   ├── env.py
│   │   └── versions/           # Individual database migration scripts
│   ├── alembic.ini             # Alembic configuration
│   ├── requirements.txt        # Backend dependencies
│   ├── run.py                  # Entrypoint for launching FastAPI server
│   └── app/                    # Backend application package
│       ├── __init__.py
│       ├── core/               # App-wide settings, security, and DB configurations
│       │   ├── config.py       # Configuration and env loaders
│       │   ├── database.py     # SQLAlchemy Engine & SessionLocal instantiation
│       │   ├── security.py     # Password hashing and JWT generation
│       │   └── middleware.py   # Global logging, CORS, and exception handling
│       └── modules/            # Business domains (Modular Monolith pattern)
│           ├── auth/           # User authentication and permissions
│           │   ├── models.py
│           │   ├── schemas.py
│           │   ├── repositories.py
│           │   ├── services.py
│           │   └── router.py
│           ├── assets/         # Asset tracking, transfers, categories
│           │   ├── models.py
│           │   ├── schemas.py
│           │   ├── repositories.py
│           │   ├── services.py
│           │   └── router.py
│           ├── finance/        # Depreciation computations and valuations
│           │   ├── models.py
│           │   ├── schemas.py
│           │   ├── repositories.py
│           │   ├── services.py
│           │   └── router.py
│           └── audit/          # Compliance audits and verification logs
│               ├── models.py
│               ├── schemas.py
│               ├── repositories.py
│               ├── services.py
│               └── router.py
└── frontend/                   # React Vite frontend codebase
    ├── package.json            # NPM dependencies and scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── vite.config.ts          # Vite configuration with path aliases
    ├── index.html              # Entry HTML
    ├── tailwind.config.js      # Tailwind style themes
    └── src/
        ├── main.tsx            # App entrypoint
        ├── App.tsx             # Root router and providers
        ├── index.css           # Core styling and Tailwind utilities
        ├── assets/             # Static logos and local media files
        ├── components/         # Reusable UI component blocks
        │   ├── ui/             # shadcn/ui components (Button, Dialog, etc.)
        │   └── layouts/        # Header, Sidebar, Dashboard wrapper
        ├── hooks/              # Global custom React hooks (useAuth, useFetch)
        ├── lib/                # Shared utilities (axios, date formatters, cn class merger)
        ├── pages/              # Route components
        │   ├── Dashboard.tsx   # Dashboard statistics overview
        │   ├── Login.tsx       # Auth login interface
        │   ├── Assets.tsx      # Core inventory list and actions
        │   ├── Depreciations.tsx # Asset calculations & graphs
        │   └── Audits.tsx      # Logged schedules and actions
        └── store/              # State management slice definitions (Zustand)
```

---

## 2. Directory Responsibilities

### 2.1 Backend Package (`backend/app/`)
*   **`core/`**: Files that configure global parameters. If it affects the entire FastAPI framework (like database engines, JWT tokens, global middleware), it lives here.
*   **`modules/`**: Contains the modular core. Each directory represents a business capability:
    *   `models.py`: Defines the SQLAlchemy DB mapping.
    *   `schemas.py`: Houses Pydantic serialization/deserialization schemas.
    *   `repositories.py`: Contains CRUD logic, decoupling the DB queries from business functions.
    *   `services.py`: Implements domain logic, validation checks, and business calculations.
    *   `router.py`: Exposes HTTP routes.

### 2.2 Frontend Package (`frontend/src/`)
*   **`components/ui/`**: Base interactive elements. They are uncoupled from API layers, accepting styling configurations and simple state props.
*   **`pages/`**: Compose components together and link directly to frontend router routes. They trigger Zustand actions to load data.
*   **`store/`**: Central store (Zustand) coordinating HTTP requests, local token storage, and UI states.
