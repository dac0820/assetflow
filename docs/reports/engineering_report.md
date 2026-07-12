# Engineering Report: AssetFlow ERP

This report details the developer environments, testing configurations, CI/CD pipelines, and local developer workflows for the engineering team building **AssetFlow ERP**.

---

## 1. Local Developer Setup

To configure a unified developer workspace on Windows, macOS, or Linux, follow these steps:

### 1.1 Backend Environment Setup (Python)
1.  **Navigate to backend**:
    ```bash
    cd backend
    ```
2.  **Create Virtual Environment**:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure environment files**:
    *   Copy `.env.example` from the root workspace to `backend/.env`.
    *   Set the database connection string or default to local Postgres settings.
5.  **Run migrations**:
    ```bash
    alembic upgrade head
    ```
6.  **Start development server**:
    ```bash
    python run.py
    ```
    *   The API server will launch at `http://localhost:8000`.
    *   Interactive Swagger docs are available at `http://localhost:8000/docs`.

### 1.2 Frontend Environment Setup (React + Vite)
1.  **Navigate to frontend**:
    ```bash
    cd frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start development server**:
    ```bash
    npm run dev
    ```
    *   The user interface launches at `http://localhost:5173`.

---

## 2. Test Automation Strategy

To ensure enterprise-grade stability, AssetFlow implements a test suite combining unit, integration, and end-to-end checks.

### 2.1 Backend Tests (pytest)
*   **Unit Tests**: Verify pure calculations, such as Straight-Line and Double Declining Depreciation values, without touching PostgreSQL.
*   **Integration Tests**: Run against an in-memory SQLite database or a test PostgreSQL instance. Confirms repository logic, router routing, and RBAC error blocks.
*   **Run command**:
    ```bash
    pytest
    ```

### 2.2 Frontend Tests (Vitest & Playwright)
*   **Component Verification (Vitest)**: Tests component behaviors (e.g., button clicks, invalid password checks, table filtering).
*   **End-to-End Tests (Playwright)**: Automates headless browser interactions to check complete user flows, like logging in, creating an asset, and checking its depreciation schedule.
*   **Run commands**:
    ```bash
    npm run test       # Run Vitest
    npx playwright test # Run End-to-End browser tests
    ```

---

## 3. Continuous Integration & Deployment (CI/CD)

All updates to the codebase trigger automated workflows in **GitHub Actions** to guarantee quality.

```
       [Developer Push]
              │
              ▼
    [GitHub Actions Runner]
    ├── Ruff Linting (Backend)
    ├── ESLint & Prettier (Frontend)
    ├── Run Pytest Suite
    └── Run Vitest Suite
              │
      (Passes Checks)
              ▼
   [Automated Deployment]
   ├── Vite App to Vercel CDN
   └── FastAPI API Container to Render
```

### 3.1 Quality Gate Rules
1.  **Branch Protection**: Direct pushes to `main` are disabled. All merges require an approved Pull Request.
2.  **Required Approvals**: At least one senior engineer must approve the PR.
3.  **CI Success**: The GitHub Actions runner must complete all lint and test suites successfully before the PR can merge.
