# Release Strategy & Execution Blueprint: AssetFlow ERP

This document outlines the branching strategy, environment configurations, CI/CD deployment pipelines, and release procedures for **AssetFlow ERP**.

---

## 1. Branching & Environment Strategy

AssetFlow follows a **Trunk-Based Development** model to support frequent, low-risk releases.

```
       [Developer Feature Branch]
                   │
         (PR Review & CI Pass)
                   ▼
               [main] ──> [Staging Environment]
                   │
       (Automated/Manual Verification)
                   ▼
          [Release Tag] ──> [Production Environment]
```

### 1.1 Branch Guidelines
*   **Feature Branches (`feature/*`)**: Created for specific tasks (e.g., `feature/TSK-ATH-01`). Feature branches are short-lived (merged within 2-3 days).
*   **Main Branch (`main`)**: The stable source of truth. All feature branches merge into main via Pull Requests after passing code quality checks.
*   **Release Tags (`v*.*.*`)**: Created when code on `main` is ready for production.

### 1.2 Environment Configurations

1.  **Development**:
    *   *Purpose*: Local developer environment.
    *   *Database*: Local Docker-based PostgreSQL instance.
2.  **Staging**:
    *   *Purpose*: Pre-release verification. Matches production resource limits and data volumes.
    *   *Database*: Staging PostgreSQL hosted on Render (populated with anonymized production data clones).
3.  **Production**:
    *   *Purpose*: Live customer environment.
    *   *Database*: Production PostgreSQL hosted on Render (US Oregon Region) with daily backups.

---

## 2. CI/CD Deployment Pipeline

All deployments are managed automatically via **GitHub Actions**:

### 2.1 Build & Test Phase (Triggered on Pull Requests to `main`)
1.  Initialize Python environment, install dependencies from `requirements.txt`.
2.  Run code formatting and linting checks using **Ruff**.
3.  Run unit and integration tests using **pytest**.
4.  Initialize Node environment, build frontend bundle using Vite, and run UI tests.

### 2.2 CD Deployment Phase (Triggered on merges to `main`)
1.  **Staging Deployment**:
    *   Deploy the Vite frontend static files to the Staging server.
    *   Build and deploy the FastAPI Docker container to the Staging Web Service.
    *   Run database migrations: `alembic upgrade head`.
2.  **Production Release** (Triggered by creating a Git release tag):
    *   Deploy static assets to Vercel/Render Production CDN.
    *   Deploy the FastAPI Docker container to the Production Web Service.
    *   Apply database migrations.

---

## 3. Production Rollout & Rollback Policy

### 3.1 Rollout Checklist
*   [ ] Verify staging test suite passes with 100% success.
*   [ ] Check database connection pool utilization limits.
*   [ ] Verify that a snapshot backup of the production database has completed.
*   [ ] Deploy backend container and static frontend assets.
*   [ ] Run database migration scripts: `alembic upgrade head`.
*   [ ] Run post-deployment tests (health check endpoints).

### 3.2 Rollback Procedure
If post-deployment checks fail or critical errors are reported:
1.  **Revert Code**: Revert the production container image version to the previous tag in the Render control panel.
2.  **Restore Database**: If migrations modified schemas and caused errors:
    *   Run `alembic downgrade -1` to roll back the database version, or:
    *   Restore the database to the pre-deployment snapshot backup if data corruption occurred.
