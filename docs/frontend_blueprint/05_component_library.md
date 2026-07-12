# Component Library: AssetFlow ERP

This document contains the TypeScript Prop definitions, visual structures, and state specifications for the reusable UI components in **AssetFlow ERP**.

---

## 1. Global Core Components

---

### 1.1 `AssetCard`
*   **Purpose**: Displays an asset's status, condition, and location in catalog grids.
*   **TypeScript Definition**:
    ```typescript
    interface AssetCardProps {
      id: string;
      name: string;
      serialNumber: string;
      categoryName: string;
      status: 'available' | 'allocated' | 'maintenance' | 'retired' | 'lost';
      condition: 'excellent' | 'good' | 'fair' | 'damaged';
      locationName: string;
      onActionClick?: (action: 'allocate' | 'transfer' | 'edit') => void;
    }
    ```
*   **Layout Structure**: Card container with a top header showing the category name and status badge, a middle section displaying the asset name and serial number, and a footer listing the location and action buttons.

---

### 1.2 `BookingCalendar`
*   **Purpose**: A calendar interface for scheduling shared resource reservations.
*   **TypeScript Definition**:
    ```typescript
    interface CalendarEvent {
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      resourceId: string;
      status: 'requested' | 'confirmed' | 'cancelled';
    }
    
    interface BookingCalendarProps {
      events: CalendarEvent[];
      onSlotSelect: (start: Date, end: Date) => void;
      onEventSelect: (event: CalendarEvent) => void;
    }
    ```
*   **Layout Structure**: Monthly/weekly grid view with header navigation controls, color-coded event cards (green: confirmed, amber: requested), and hover tooltips showing event details.

---

### 1.3 `MaintenanceTimeline`
*   **Purpose**: Chronologically displays repair and maintenance events for a single asset.
*   **TypeScript Definition**:
    ```typescript
    interface TimelineStep {
      id: string;
      title: string;
      date: string;
      description: string;
      technicianName: string;
      cost?: number;
      status: 'scheduled' | 'in_progress' | 'completed';
    }
    
    interface MaintenanceTimelineProps {
      steps: TimelineStep[];
    }
    ```
*   **Layout Structure**: Left-aligned vertical path line with node dots indicating step status, chronological dates, action descriptions, technician names, and logged repair costs.

---

### 1.4 `AuditTable`
*   **Purpose**: Checklist interface for auditors conducting physical inventory scans.
*   **TypeScript Definition**:
    ```typescript
    interface AuditRow {
      assetId: string;
      name: string;
      serialNumber: string;
      expectedLocation: string;
      verifiedLocation?: string;
      isPresent: boolean;
      condition: 'excellent' | 'good' | 'fair' | 'damaged';
      notes?: string;
    }
    
    interface AuditTableProps {
      rows: AuditRow[];
      onVerifyRow: (assetId: string, updates: Partial<AuditRow>) => void;
      onSubmitAudit: () => void;
    }
    ```
*   **Layout Structure**: Table layout with checklist columns, condition dropdown selectors, and action buttons to verify items or flag discrepancies.

---

### 1.5 `CommandPalette`
*   **Purpose**: Global search and quick navigation modal opened with `Cmd+K` or `Ctrl+K`.
*   **TypeScript Definition**:
    ```typescript
    interface CommandOption {
      label: string;
      action: () => void;
      category: 'navigation' | 'actions' | 'assets';
      shortcut?: string;
    }
    
    interface CommandPaletteProps {
      isOpen: boolean;
      onClose: () => void;
    }
    ```
*   **Layout Structure**: Centered modal overlay backdrop with a top search input field, filtered list results grouped by category, and keyboard shortcut tips.
