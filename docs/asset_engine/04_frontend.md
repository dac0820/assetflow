# Asset Engine Frontend Design: AssetFlow ERP

This document specifies the user interface (UI) components, form validation rules, and page designs for the **Asset Management Engine** frontend.

---

## 1. Directory Listing Table & Virtualization

To display directories containing thousands of assets without browser lag, the listing table uses **`react-window`** for row virtualization.

*   **Filter Panel**: Sidebar containing accordion dropdowns:
    *   *Category*: Multi-select checkboxes.
    *   *Status*: Status badge selectors (Available, Allocated, Maintenance).
    *   *Condition*: Dropdown options (Excellent, Good, Fair, Damaged).
    *   *Purchase Cost Range*: Dual-slider component.
*   **Search**: Main text input with search term debouncing (300ms delay) to prevent redundant API requests.

---

## 2. Forms Design & Client-Side Validation

Forms are implemented using **React Hook Form** and validated client-side with **Zod**:

```typescript
import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(255),
  serialNumber: z.string().min(3, "Serial number is required").max(100),
  categoryId: z.string().uuid("Please select a valid category"),
  purchaseCost: z.number().positive("Cost must be a positive number"),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  salvageValue: z.number().nonnegative(),
  usefulLifeYears: z.number().int().min(1, "Useful life must be at least 1 year"),
  locationId: z.string().uuid("Please select a valid location"),
}).refine((data) => data.salvageValue <= data.purchaseCost, {
  message: "Salvage value cannot exceed purchase cost",
  path: ["salvageValue"],
});
```

---

## 3. Asset Details & Historical Timelines

The detail view uses a tabbed layout to organize asset data:

```
[General Info]  |  [Allocation History]  |  [Financial Schedule]  |  [Repair History]
```

*   **Financial Schedule Tab**: Renders a line chart using **Recharts** showing the asset's projected valuation curve over its useful lifecycle.
*   **Repair History Tab**: Displays an interactive vertical timeline component:
    *   *Nodes*: Dynamic status indicators (green: resolved, amber: in-progress, red: reported).
    *   *Details*: Repair date, cost, technician name, and notes.

---

## 4. QR Code Scanning Integration

The mobile/tablet view integrates with the device camera to support physical asset scanning:
1.  **Scanner Interface**: Uses `react-html5-qrcode` to render a live camera overlay on the screen.
2.  **Scan Logic**: When a QR code is read, the scanner parses the encoded URL:
    *   *Payload format*: `https://assetflow.com/assets/{uuid}`
3.  **Navigation**: The application extracts the asset UUID from the payload and navigates the user directly to the corresponding Asset Details page.
