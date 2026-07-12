# 🌐 AssetFlow ERP

**AssetFlow ERP** is a premium, enterprise-grade Asset Lifecycle, Compliance, & Resource Management ERP system. It consolidates asset tracking, audit compliance, financial depreciation calculations, resource bookings, and maintenance dispatching into a unified dashboard, replacing manual spreadsheet tracking and email approval flows.

---

## 🚀 Key Modules & Capabilities

1. **Asset Registry & QR Tracking**:
   * Consolidated asset tracking with metadata, categories, serial numbers, and financial details.
   * Automated QR code generation to support mobile audits and physical scans.
   * Virtualized listings to support high performance when viewing tens of thousands of items.
2. **Operations & Logistics**:
   * **Custody Allocations**: Streamlined department and employee assignment forms with status validation.
   * **Resource Bookings**: Inter-department bookings (e.g., conference rooms, shared vehicles) with real-time overlap validation.
   * **Location Transfers**: Formal multi-department sign-offs and location auditing history.
3. **Enterprise Maintenance (CMMS)**:
   * A full 10-stage maintenance workflow lifecycle: `pending_approval` ➔ `approved` ➔ `assigned` ➔ `started` ➔ `paused` (e.g. waiting parts) ➔ `resumed` ➔ `completed` ➔ `qa_inspection` ➔ `resolved` ➔ `closed`.
   * Automated SLA due date calculation and duplicate submission checks (24-hour deduplication).
   * Detailed technician assignment, maintenance labor tracking, actual vs. estimated cost auditing, and public/internal comments.
4. **Audit & Compliance**:
   * Audit scheduler and manager cycle controls.
   * Scan verification checking, auditor sign-offs, and automatic discrepancy ticketing for missing or damaged assets.
5. **Financial Valuation & Depreciation**:
   * Straight-Line and Double-Declining depreciation schedules.
   * Aggregate valuations, historical asset valuation charts, and background task integration for monthly closure tasks.
6. **Identity & Role-Based Access Control (RBAC)**:
   * Secure JSON Web Token (JWT) sessions and hashed passwords (`bcrypt`).
   * Role-based permissions matching: Admin, Manager, Accountant, Employee, Technician, and Auditor.

---

## 🏗️ Architecture & Technology Stack

The platform is designed as a split-client architecture separating front-end presentation from back-end logic, backed by a persistent relational database:

```
┌─────────────────────────────────┐
│     React Frontend Client       │  ◄── Zustand State Store
└────────────────┬────────────────┘
                 │ (JSON over HTTP/HTTPS)
                 ▼
┌─────────────────────────────────┐
│       FastAPI API Gateway       │  ◄── SlowAPI Rate Limiting
└────────────────┬────────────────┘
                 │ (SQLAlchemy ORM)
                 ▼
┌─────────────────────────────────┐
│      PostgreSQL Database        │  ◄── Alembic Schema Versioning
└─────────────────────────────────┘
```

* **Frontend**: [React 18](file:///f:/coding/big_projects/assetflow/frontend/src/main.tsx) + [TypeScript](file:///f:/coding/big_projects/assetflow/frontend/tsconfig.json) + [Vite](file:///f:/coding/big_projects/assetflow/frontend/vite.config.ts)
  * **State Management**: [Zustand](file:///f:/coding/big_projects/assetflow/frontend/src/stores/authStore.ts)
  * **Styles & Layout**: Tailwind CSS + custom Vanilla CSS for modern, premium design aesthetics (glassmorphism, micro-animations, curated dark mode).
* **Backend**: [FastAPI Engine](file:///f:/coding/big_projects/assetflow/backend/app/main.py) (Python 3.10+)
  * **Database Engine**: PostgreSQL, powered by [SQLAlchemy ORM](file:///f:/coding/big_projects/assetflow/backend/app/core/database.py).
  * **Migrations**: [Alembic Versioning](file:///f:/coding/big_projects/assetflow/backend/alembic) with epoch migration sorting.
  * **Validation & Schemas**: Pydantic v2.

---

## 📂 Project Structure

```
assetflow/
├── backend/                       # Python FastAPI Backend
│   ├── alembic/                   # Database version migrations
│   ├── app/                       # Application code
│   │   ├── api/                   # Router endpoints (auth, assets, bookings, maintenance, etc.)
│   │   ├── core/                  # Database connections and security controls
│   │   ├── models/                # SQLAlchemy database schema models
│   │   ├── repositories/          # Database query abstractions
│   │   ├── schemas/               # Pydantic input/output schemas
│   │   └── services/              # Business rule calculations & operations
│   ├── requirements.txt           # Python dependency file
│   ├── run.py                     # Backend development runner script
│   ├── seed.py                    # Script to initialize demo data (locations, assets, employees)
│   └── test_maintenance.py        # Integration test script for the CMMS workflow
│
├── frontend/                      # React TypeScript Frontend
│   ├── src/                       # Source code directory
│   │   ├── assets/                # Global static assets
│   │   ├── components/            # UI components (tables, calendars, inputs)
│   │   ├── layouts/               # Page layout shells
│   │   ├── pages/                 # Full dashboard pages (Assets, Maintenance, Bookings, Audits, etc.)
│   │   ├── routes/                # Application routes
│   │   ├── services/              # API communications client
│   │   ├── stores/                # Global states (Auth states, session tokens)
│   │   ├── App.tsx                # Client entry component
│   │   └── index.css              # Main stylesheets
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.ts             # Vite development configurations
│
└── docs/                          # Architectural Design Blueprints
    ├── business_blueprint/        # Business rules, domain models, and KPIs
    ├── database_blueprint/        # SQLAlchemy schemas, alembic strategies, and optimizations
    ├── frontend_blueprint/        # Component inventory, navigation rules, and state designs
    └── iam_blueprint/             # RBAC mapping, auth layouts, and security audits
```

---

## ⚙️ Development Environment Setup

To run AssetFlow locally, you need to launch both the backend API and the frontend Vite web server:

### 1. Backend Setup

1. **Navigate to the backend folder**:
   ```powershell
   cd backend
   ```

2. **Create and Activate a virtual environment**:
   * On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations & Seeds**:
   By default, the backend will connect to the cloud PostgreSQL database specified in `backend/app/core/database.py` unless you override the `DATABASE_URL` environment variable.
   * Run the Alembic migrations:
     ```bash
     alembic upgrade head
     ```
   * Seed default items (essential for the application and test scripts to run):
     ```bash
     python seed.py
     ```

5. **Start the API Server**:
   ```bash
   python run.py
   ```
   The backend API will run at `http://127.0.0.1:8000`. You can explore the interactive API docs at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

1. **Navigate to the frontend folder**:
   ```powershell
   cd frontend
   ```

2. **Install Node Packages**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The web application will open at `http://localhost:5173`.

---

## 🧪 Integration Testing

The backend includes a specialized test suite to verify the logic and transitions of the 10-stage maintenance engine.

To run the integration tests:
1. Ensure the backend API server is running on `http://localhost:8000`.
2. Open a separate terminal, navigate to the `backend` directory, activate the virtual environment, and run:
   ```bash
   python test_maintenance.py
   ```

This test suite runs **22 endpoints** over a full Happy Path and Edge Case cycle, verifying details such as:
* Duplicate work orders are blocked within 24 hours.
* Rejections require detailed notes.
* Asset status toggles dynamically on approval and final resolution closure.
* Comprehensive audit logging and immutable transitions.

---

## 📑 Architectural Blueprints

For in-depth details of specifications, rules, security controls, and design system choices, review the files in the `docs` folder:
* 📄 **Business Processes**: See [business_analysis.md](file:///f:/coding/big_projects/assetflow/docs/business_blueprint/01_business_analysis.md)
* 📄 **Database Schemas & Migrations**: See [alembic_strategy.md](file:///f:/coding/big_projects/assetflow/docs/database_blueprint/02_alembic_strategy.md)
* 📄 **API Specifications & RBAC Security**: See [rbac_architecture.md](file:///f:/coding/big_projects/assetflow/docs/iam_blueprint/02_rbac_architecture.md)
* 📄 **Frontend UX / Components**: See [design_system.md](file:///f:/coding/big_projects/assetflow/docs/frontend_blueprint/02_design_system.md)
