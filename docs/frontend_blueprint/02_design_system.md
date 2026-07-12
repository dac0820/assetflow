# Design System Specification: AssetFlow ERP

This document defines the core styling variables, tailwind theme extensions, typography, and component visual rules for **AssetFlow ERP**.

---

## 1. Color Palette (Tailwind HSL Definitions)

We implement a modern, high-contrast palette tailored for clarity and readability in corporate environments.

### 1.1 Light Mode Color Variables
```css
:root {
  --background: 0 0% 100%;       /* #FFFFFF */
  --foreground: 224 71.4% 4.1%;  /* #090D1F */
  --card: 0 0% 98%;              /* #FAFAFA */
  --card-foreground: 224 71.4% 4.1%;
  
  --primary: 221.2 83.2% 53.3%;  /* Royal Blue #2563EB */
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;    /* Slate-100 #F1F5F9 */
  --secondary-foreground: 222.2 47.4% 11.2%;

  --success: 142.1 76.2% 36.3%;  /* Emerald green */
  --warning: 37.9 90% 51.1%;     /* Alert orange */
  --destructive: 0 84.2% 60.2%;  /* Red #EF4444 */
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
}
```

### 1.2 Dark Mode Color Variables
```css
.dark {
  --background: 222.2 84% 4.9%;   /* Deep Slate */
  --foreground: 210 40% 98%;
  --card: 222.2 84% 7%;
  --card-foreground: 210 40% 98%;
  
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

---

## 2. Typography & Hierarchy

AssetFlow uses **Inter** (sans-serif) as the primary font for interface copy, tables, and forms, paired with **Outfit** (sans-serif) for page headings and analytics metrics.

| Size | Value | Line Height | Application |
| :--- | :--- | :--- | :--- |
| **`xs`** | `0.75rem` (12px) | `1rem` | Table headers, secondary timestamps, helper text |
| **`sm`** | `0.875rem` (14px)| `1.25rem` | Core table cell value, form labels, body text |
| **`base`**| `1rem` (16px) | `1.5rem` | Input text, descriptions, cards sub-headers |
| **`lg`** | `1.125rem` (18px)| `1.75rem` | Section subtitles, card header titles |
| **`xl`** | `1.25rem` (20px) | `1.75rem` | Detail title modal headers |
| **`2xl`**| `1.5rem` (24px) | `2rem` | Page Titles |
| **`3xl`**| `1.875rem` (30px)| `2.25rem` | Key Metric / KPI Display Numbers |

---

## 3. Spacing System

All components use a standard 4px baseline spacing scale (`rem` equivalents):

*   `0.25rem` (4px) - Padding for icons inside buttons, sub-label margins.
*   `0.5rem` (8px) - Gap for inline elements, small list gaps.
*   `0.75rem` (12px) - Padding for table rows, tag items list spacing.
*   `1rem` (16px) - Padding for base forms, small card blocks.
*   `1.5rem` (24px) - Padding for page layouts, desktop sections.
*   `2rem` (32px) - Large spacing offsets.

---

## 4. Reusable Component Visual Specifications

---

### 4.1 Buttons
*   **Primary**: Filled background in primary color (`Royal Blue`), text-white. Used for main action pathways (e.g., "Add Asset", "Schedule Audit").
*   **Secondary**: Subtle gray background, text-foreground color. Used for secondary or alternative actions.
*   **Outline**: Transparent background with border, colored text. Used for page-level navigation items.
*   **Destructive**: Filled background in red, text-white. Reserved for permanent or high-risk actions (e.g., "Retire Asset", "Delete User").

---

### 4.2 Text Inputs
*   **Normal State**: Border width: 1px, neutral outline.
*   **Focus State**: Border color matches primary blue, rings offset: 2px.
*   **Error State**: Border color matches destructive red, with helper text in red shown below the input.

---

### 4.3 Interactive Cards
*   **Styling**: Rounded corners (`rounded-lg` / 8px radius), subtle shadow.
*   **Hover Effect**: Elevates slightly with scale transition and border color shifts:
    ```css
    transition: transform 0.2s ease, border-color 0.2s ease;
    ```
