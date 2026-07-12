# Development Roadmap & Milestones: AssetFlow ERP

This document contains the strategic development roadmap, milestone plans, and module parameters for **AssetFlow ERP**.

---

## 1. Project Milestones

The rollout is divided into five milestones, mapping development over a **15-week timeline**:

| Milestone | Title | Duration | Primary Focus | Target Deliverables | Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | Foundations & Identity | Weeks 1-3 | Auth, security guards, DB schemas | User auth, login screens, API guards | Medium |
| **M2** | Inventory Ledger | Weeks 4-6 | Core Asset registry, QR labels, categories | Asset forms, search table directory | Medium |
| **M3** | Operations & Finance | Weeks 7-9 | Custody allocations, depreciation calculations | Transfer flows, depreciation schedules | High |
| **M4** | Compliance Audit | Weeks 10-12| Audit cycles, scanner verification, alerts | Verification sheets, discrepancy logs | High |
| **M5** | Integrations & Release | Weeks 13-15| CI/CD automation, API export, load testing | PDF generation, final deployment | Low |

---

## 2. Core Modules Breakdown

---

### 2.1 Identity & Access Module (Auth)
*   **Purpose**: Manages system authentication and role-based permissions.
*   **Business Value**: Secures sensitive financial data and asset registries.
*   **Dependencies**: None.
*   **Priority**: High (Must-Have).
*   **Complexity**: Medium.
*   **Estimated Development Time**: **3 Weeks**.
*   **Risk Level**: Medium (Potential for JWT leakage or privilege escalation).
*   **Required Skills**: FastAPI security layers, token cryptography, React context guards.
*   **Testing Requirements**: Unit tests for token generation, integration tests verifying RBAC route blocks.
*   **Future Expansion**: Integration with Okta, Azure AD, or corporate OAuth portals.

---

### 2.2 Asset Catalog Module
*   **Purpose**: General ledger for physical and digital assets.
*   **Business Value**: Prevents duplicate purchases, reduces data silos, and tracks asset count.
*   **Dependencies**: Auth Module.
*   **Priority**: High (Must-Have).
*   **Complexity**: Medium.
*   **Estimated Development Time**: **3 Weeks**.
*   **Risk Level**: Low.
*   **Required Skills**: Pydantic validation, React table layouts, virtualized lists.
*   **Testing Requirements**: Uniqueness checks for serial numbers, pagination load tests.
*   **Future Expansion**: Supporting sub-components, bulk importing from external inventories.

---

### 2.3 Operations & Finance Module
*   **Purpose**: Manages asset allocations, department transfers, and depreciation calculations.
*   **Business Value**: Extends asset lifecycles and ensures compliance with financial accounting standards (IFRS 16).
*   **Dependencies**: Auth Module, Asset Catalog.
*   **Priority**: High (Must-Have).
*   **Complexity**: High.
*   **Estimated Development Time**: **3 Weeks**.
*   **Risk Level**: High (Depreciation calculations affect tax reporting).
*   **Required Skills**: Business math, background task scheduling (Celery), database transaction management.
*   **Testing Requirements**: Unit tests for depreciation calculations, database checks for concurrent transfers.
*   **Future Expansion**: Automatic integration with SAP or Oracle General Ledger.

---

### 2.4 Compliance Audit Module
*   **Purpose**: Manages physical inventory verification cycles.
*   **Business Value**: Detects lost assets, reduces insurance costs, and flags damaged equipment.
*   **Dependencies**: Operations & Finance Module.
*   **Priority**: Medium (Should-Have).
*   **Complexity**: High.
*   **Estimated Development Time**: **3 Weeks**.
*   **Risk Level**: Medium (Lost items affect balance sheets).
*   **Required Skills**: QR code scanning integration, offline caching, database schema synchronization.
*   **Testing Requirements**: Offline reconciliation tests, barcode scanner input tests.
*   **Future Expansion**: Real-time GPS mapping and RFID tag scanning.
