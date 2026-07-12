# Dependency Map & Feature Checklist: AssetFlow ERP

This document maps out the system's structural dependencies and details the implementation checklist for all core features of **AssetFlow ERP**.

---

## 1. Optimal Development Sequence

The development sequence follows a Directed Acyclic Graph (DAG), ensuring each module is built on a verified foundation:

```
[Authentication] 
       ↓
[Roles & Permissions]
       ↓
[Departments] 
       ↓
[Employees] 
       ↓
[Asset Categories] 
       ↓
[Assets & Locations]
       ↓
┌──────┴───────────────┐
▼                      ▼
[Allocations & Bookings] [Maintenance Logs]
       │               │
       ▼               ▼
[Audit Cycles] ────────┘
       │
       ▼
[Valuation & Reports]
       │
       ▼
[Notifications & Releases]
```

### Rationale Behind the Sequence
1.  **Identity Layer First**: Authentication and permissions must be established early. All subsequent API endpoints import security dependencies (`Depends`) to verify roles and permissions.
2.  **Organization Model**: Departments and Employees are parent models for allocations. You cannot assign an asset to an employee who does not exist in the database.
3.  **Asset Registry**: Assets depend on Category properties (for default depreciation rules) and Location parameters (for check constraints).
4.  **Operational Layer**: Allocations, Bookings, and Maintenance histories reference asset records.
5.  **Compliance & Finance**: Audits verify registered assets, and Reports aggregate financial depreciation data.

---

## 2. Feature Checklist

---

### 2.1 Asset Registry Module
*   [x] **Asset Registration**: Form inputs, metadata verification, invoice file uploads.
*   [x] **QR Code Generation**: Create unique code strings and QR labels for printing.
*   [x] **Directory Listings**: Search filters, sorting, category views, and virtualized list scrolling.
*   [x] **Location Transfers**: Transfer requests, manager sign-offs, and location logs.

---

### 2.2 Operations & Logistics Module
*   [x] **Custody Allocations**: Assignment forms, active status checks, and return logs.
*   [x] **Resource Bookings**: Calendar booking grid, overlap conflict checks, and cancel options.
*   [x] **Maintenance Logs**: Technician dispatch forms, cost trackers, and repair history files.

---

### 2.3 Financial & Depreciation Module
*   [x] **Depreciation Calculator**: Straight-Line calculations, Double Declining computations.
*   [x] **Ledger Valuations**: Financial dashboard summaries, valuation charts, and export tools.
*   [x] **Background Jobs**: Celery task runner for batch financial close-out.

---

### 2.4 Audit & Compliance Module
*   [x] **Audit Cycles**: Audit scheduler, active cycles tracker.
*   [x] **Audit Verification**: Scanner validation checklist, auditor signature logs.
*   [x] **Discrepancy Tickets**: Missing alerts, condition discrepancy logs, and resolution statuses.
