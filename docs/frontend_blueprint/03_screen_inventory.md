# Screen Inventory Specification: AssetFlow ERP

This document specifies the layouts, key actions, state validations, and responsive behaviors for the **19 core screens** of the **AssetFlow ERP** platform.

---

## 1. Authentication Screens

### 1.1 Login Screen
*   **Purpose**: Authenticate user credentials and store session parameters.
*   **Component Layout**: Centered card container, corporate logo header, email/password fields, "Forgot Password" link, submit button.
*   **Key Actions**: Sign In, Redirect to Forgot Password.
*   **Validations**: Email must be a valid format; password must be at least 12 characters.
*   **Responsive View**:
    *   *Mobile/Tablet*: Full screen width, hidden side-banner.
    *   *Desktop*: Split view: 50% illustrations/metrics banner, 50% centered card.

### 1.2 Forgot Password Screen
*   **Purpose**: Request a password reset link.
*   **Component Layout**: Centered card, email input field, "Back to Login" link.
*   **Validations**: Email format matching corporate domains.
*   **States**:
    *   *Success State*: Replaces form with a success checkmark and confirmation message.

---

## 2. Dashboard Screens

### 2.3 Dashboard Screen (Dynamic by Role)
*   **Purpose**: Central hub displaying metrics, recent activities, and quick actions based on user roles.
*   **Component Layout**: 
    *   *Top Section*: KPI summary metrics cards (Total Assets, Allocated Count, Open Audits, Cost Totals).
    *   *Middle Section*: Line chart (Valuation over time) and Bar chart (Asset count by category).
    *   *Bottom Section*: Side-by-side layout: Pending approvals list, and Recent activity logs.
*   **Key Actions**: Approve transfer, start audit, click quick-action shortcuts.
*   **Responsive View**:
    *   *Mobile*: Stacked column view. Single card columns.
    *   *Tablet*: 2-column grid.
    *   *Desktop*: 4-column KPI cards row, 2-column charts grid.

---

## 3. Administration & HR Screens

### 2.4 Departments Screen
*   **Purpose**: Manage corporate divisions.
*   **Component Layout**: Data table listing divisions, search filter bar, "Add Department" dialog form.
*   **Validations**: Department name cannot be blank; code must match `^DEPT-[A-Z]{3,4}$`.

### 2.5 Employees Screen
*   **Purpose**: Manage staff records and custody statuses.
*   **Component Layout**: Data table listing employee records, including columns for active allocations, status indicators, and department search filters.
*   **Key Actions**: Edit employee info, trigger status updates (Active/Terminated).

### 2.6 Roles Screen
*   **Purpose**: Manage user access roles and permissions.
*   **Component Layout**: List card showing roles, grid detailing permissions checkboxes for the selected role, submit buttons.

---

## 4. Asset Inventory & Registration

### 2.7 Asset Categories Screen
*   **Purpose**: Classify inventory items.
*   **Component Layout**: Category grid cards, default useful life settings inputs, depreciation method selection dropdown.

### 2.8 Asset Registration Screen
*   **Purpose**: Register new physical inventory items.
*   **Component Layout**: Form layout with inputs for Asset Name, Serial Number, Category, Purchase Date, Purchase Cost, Salvage Value, and Location. Includes drag-and-drop file upload for invoices.
*   **Validations**: Salvage value must be less than or equal to purchase cost.

### 2.9 Asset Directory Screen
*   **Purpose**: General ledger catalog interface.
*   **Component Layout**: Data table with virtualized scrolling, filters panel (Category, Location, Condition, Status), and search bar.
*   **Key Actions**: Sort columns, filter assets, click rows to open details.

### 2.10 Asset Details Screen
*   **Purpose**: Complete properties detail card view for a single asset.
*   **Component Layout**: Tabs-based layout:
    *   *General*: Name, location, metadata, condition.
    *   *Custody*: Historic allocations table.
    *   *Finance*: Valuation line charts and depreciation schedules table.
    *   *Auditing*: Physical validation history.

---

## 5. Operations & Workflows

### 2.11 Allocation Screen
*   **Purpose**: Assign assets to employees.
*   **Component Layout**: Custody forms, employee select fields, asset select cards, expected return date scheduler.

### 2.12 Transfer Requests Screen
*   **Purpose**: Manage location transfers.
*   **Component Layout**: Two columns:
    *   *Left Column*: List of pending, approved, and rejected transfer requests.
    *   *Right Column*: Details of the selected transfer, including approval timeline and notes.

### 2.13 Booking Calendar Screen
*   **Purpose**: Schedule shared resource reservations.
*   **Component Layout**: Sidebar listing categories, calendar interface (Day/Week/Month views), booking form modal.

### 2.14 Maintenance Screen
*   **Purpose**: Manage repairs.
*   **Component Layout**: Technician dispatch lists, priority queues, repair cost trackers, maintenance history log.

### 2.15 Audit Screen
*   **Purpose**: Manage physical inventory audits.
*   **Component Layout**: Scanner connection indicators, checklist table (Asset, Expected Location, Verified checkbox), discrepancy log form.

---

## 6. Reports & Settings

### 2.16 Reports Screen
*   **Purpose**: Export financial and valuation data.
*   **Component Layout**: Financial tables, export format buttons (CSV/PDF), date selectors, and custom report builders.

### 2.17 Notifications Screen
*   **Purpose**: View system alerts.
*   **Component Layout**: Inbox-style layout split into "unread" and "archived" columns.

### 2.18 Settings Screen
*   **Purpose**: System configurations.
*   **Component Layout**: Form settings: mail server fields, theme toggles (dark/light), backup intervals.

### 2.19 Profile Screen
*   **Purpose**: Personal profile page.
*   **Component Layout**: Profile details card, password change inputs, active session logs list.
