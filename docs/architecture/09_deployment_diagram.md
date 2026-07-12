# Deployment Diagram: AssetFlow ERP

This document outlines the hosting topology, production infrastructure, and network architecture for **AssetFlow ERP** deployed on the **Render** cloud platform.

---

## 1. Production Deployment Topology

The infrastructure leverages managed services to reduce administrative overhead while ensuring scalability and security.

```mermaid
graph TD
    %% Internet/Clients
    User[Client Web Browsers] -->|HTTPS| CDN[Vercel CDN / Render Static Site]
    
    %% API Requests
    User -->|HTTPS API Requests| Gateway[Cloudflare CDN / DNS]
    Gateway -->|Forward requests| WebService[Render Web Service: FastAPI + Uvicorn]
    
    %% Backend environment VPC
    subgraph Render Private Network (VPC)
        WebService -->|Write / Read| DB[(Render PostgreSQL Managed Database)]
        WebService -->|Task Queue / Cache| Cache[(Render Redis Cache)]
        
        %% Worker Node
        Worker[Render Background Worker: Celery] -->|Poll tasks| Cache
        Worker -->|Write audit runs| DB
    end
```

---

## 2. Infrastructure Component Specifications

### 2.1 Frontend Delivery (Vite Static Hosting)
*   **Provider**: Render Static Sites (or Vercel).
*   **Pipeline**: Automated deployment triggered by pushes to the `main` branch on GitHub.
*   **Build command**: `npm run build` (outputs optimized bundle to `dist/`).
*   **Security**: Encrypted in transit via SSL/TLS managed certificates. Headers configured with Content Security Policy (CSP) to mitigate cross-site scripting risks.

### 2.2 FastAPI Web API Service
*   **Provider**: Render Web Service.
*   **Execution environment**: Docker container running Python 3.11, managed via `uvicorn app.run:app --host 0.0.0.0 --port $PORT --workers 4`.
*   **Auto-Scaling**: Configured to scale from 1 to 3 instances based on average CPU/Memory threshold (exceeding 70% usage).

### 2.3 Background Queue & Cache (Redis)
*   **Provider**: Render Redis.
*   **Purpose**:
    1.  Acts as the Celery message broker.
    2.  Handles active user session caching.
    3.  Performs data caching for high-latency analytical assets reports.
*   **Security**: Isolated within Render's internal private network. Cannot be accessed from the public internet.

### 2.4 Production Database (PostgreSQL)
*   **Provider**: Render Managed PostgreSQL (Oregon US Region).
*   **High Availability**: Configured with automatic daily backups and point-in-time recovery.
*   **Security**: Encrypted at rest. SSL mandatory for connection strings. Connections limited to the Render VPC IP range.

---

## 3. Deployment Configuration Variables (`.env` equivalent)

All services reference environmental properties configured via the Render dashboard.

*   `DATABASE_URL`: Set dynamically from the Render PostgreSQL resource binding.
*   `REDIS_URL`: Binds to the private Render Redis URL.
*   `JWT_SECRET`: Random 256-bit key injected securely during container initialization.
*   `CORS_ORIGINS`: JSON array restricting backend endpoints access to the frontend origin (e.g., `["https://assetflow-erp.render.com"]`).
