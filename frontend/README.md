# AssetFlow — Enterprise Asset & Resource ERP

A React 19 + TypeScript + Vite 8 SPA for asset lifecycle management, bookings, maintenance (CMMS), transfers, audits, and reporting.

---

## Getting Started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## Mock Data Mode (Default)

No backend is needed. The app runs entirely on **static mock data** persisted in `localStorage`.  
To toggle, edit `src/services/dataService.ts`:

```ts
export const USE_MOCK = true;  // false = use real API at localhost:8000
```

### Reset Mock Data

Open browser console and run:

```js
import { mockUtils } from "./services/mockService";
mockUtils.clearAllData();
```

Or clear `localStorage` manually for keys prefixed `assetflow_mock_`.

---

## Login Credentials by Role

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@assetflow.com` | `admin123` | Full CRUD on assets, user management, settings write |
| **Manager** | `manager@assetflow.com` | `manager123` | Read/create assets, handle approvals |
| **Auditor** | `auditor@assetflow.com` | `auditor123` | Read assets, run audits, view reports |
| **Employee** | `employee@assetflow.com` | `employee123` | Read-only asset view |

> Login with any email starting with `admin`/`manager`/`auditor` — but the above are the **complete profile logins** with proper role-based access.

---

## Pages & Features

| Page | Route | Data Source |
|------|-------|-------------|
| **Dashboard** | `/` | `mockDashboard.ts` — KPIs, valuation chart, pending approvals |
| **Assets Catalog** | `/assets` | `mockAssets.ts` — 8 assets with search filtering |
| **Resource Bookings** | `/bookings` | `mockBookings.ts` — Create/cancel reservations |
| **Transfer Requests** | `/transfers` | `mockTransfers.ts` — Approve/reject inter-department transfers |
| **Maintenance (CMMS)** | `/maintenance` | `mockMaintenance.ts` — Kanban/List/Analytics views, full workflow |
| **Compliance Audits** | `/audits` | `mockAudits.ts` — 3 audit cycles with progress bars |
| **Financial Reports** | `/reports` | `mockReports.ts` — Downloadable report files |
| **System Settings** | `/settings` | Hardcoded default form values |

---

## Project Structure

```
src/
├── data/                    # Static mock data modules (typed)
│   ├── mockAssets.ts
│   ├── mockUsers.ts
│   ├── mockBookings.ts
│   ├── mockTransfers.ts
│   ├── mockMaintenance.ts
│   ├── mockDashboard.ts
│   ├── mockAudits.ts
│   ├── mockReports.ts
│   └── mockSettings.ts
├── services/
│   ├── api.ts               # Real API client (Axios + endpoints)
│   ├── mockDb.ts            # In-memory DB with localStorage persistence
│   ├── mockService.ts       # Full mock implementations of all services
│   └── dataService.ts       # Unified entry point — toggle mock vs real
├── pages/                   # Route page components
├── components/              # Shared components (ProtectedRoute, RoleGuard)
├── layouts/                 # DashboardLayout (sidebar + navbar)
├── routes/                  # React Router config
└── stores/                  # Zustand auth store
```

---

## Architecture — Mock Data Layer

```
Pages (AssetsCatalog, Bookings, ...)
        │
        ▼
dataService.ts        ← Set USE_MOCK = true/false here
        │
   ┌────┴────┐
   │         │
mockService.ts    api.ts (real backend)
   │
   ▼
mockDb.ts (Collection class)
   │
   ├── In-memory Map per entity
   ├── localStorage sync (assetflow_mock_* keys)
   └── CRUD: getAll, getById, create, update, delete, query
```

---

## Tech Stack

React 19, TypeScript 6, Vite 8, TanStack Query 5, Zustand 5, Axios, React Router 7, Tailwind CSS 3, Framer Motion 12, Recharts, React Hook Form + Zod, Radix UI, Lucide
