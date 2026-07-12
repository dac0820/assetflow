# UX & Performance Engineering: AssetFlow ERP

This document contains the user experience (UX) guidelines, performance optimization rules, and responsive design systems for the **AssetFlow ERP** frontend.

---

## 1. User Experience (UX) Engineering Rules

### 1.1 Minimum Clicks Policy
*   **Rule**: Core workflows (assigning an asset, scheduling maintenance, starting an audit) must be reachable and executable in **3 clicks or less** from the primary dashboard.
*   **Implementation**: Utilizes dashboard quick-action panels and the global command palette.

### 1.2 Keyboard Shortcuts Mapping
Keyboard navigation speeds up data entry for power users:
*   `Cmd+K` or `Ctrl+K`: Opens the Global Search and Command Palette.
*   `Esc`: Closes modals, dropdown menus, and command palettes.
*   `Cmd+S` or `Ctrl+S`: Saves active forms (intercepts browser save requests).
*   `N` (when in Asset Directory): Redirects to the Asset Registration form.

### 1.3 Toast Undo Notifications
For actions that change database state (like archiving a category or updating status):
1.  When the action is executed, a toast is shown: `"Asset SN-901 archived successfully."`
2.  The toast contains a clickable **`Undo`** button.
3.  Clicking `Undo` triggers a reversal request to the backend and restores the item in the local UI cache.

---

## 2. Performance Engineering Strategies

To keep the application responsive and loading times fast:

### 2.1 Code Splitting & Lazy Routing
*   All routes under `/src/routes/` are loaded dynamically using React `lazy` and `Suspense`:
    ```typescript
    const AssetsPage = lazy(() => import('../pages/Assets'));
    ```
*   **Benefit**: Users only download the bundle assets required for their active page, reducing initial load times by up to 70%.

### 2.2 Table Virtualization
*   **Problem**: Rendering more than 1,000 rows with columns in a standard DOM table causes scrolling lag and memory issues.
*   **Solution**: The Asset Directory table implements **`react-window`** or **`react-virtualized`**.
*   **Mechanism**: The DOM only renders rows currently visible in the browser viewport. As the user scrolls, rows are dynamically recycled.

### 2.3 Image Optimization
*   Before uploading reference photos (e.g., asset condition proof), the client compresses the image to a maximum resolution of **1200px** wide using HTML5 Canvas adjustments, keeping file sizes under 200KB.

---

## 3. Responsive Strategy

AssetFlow uses Tailwind's mobile-first responsive breakpoints:

| Breakpoint | Width | Grid Columns | Navigation Layout |
| :--- | :--- | :--- | :--- |
| **Mobile (`sm`)** | `< 640px` | 1 Column | Collapsible bottom drawer menu |
| **Tablet (`md`)** | `648px - 1024px`| 2 Columns | Sidebar collapsed to icon-only mode |
| **Desktop (`lg`+)**| `> 1024px` | 4 Columns | Full vertical sidebar with visible labels |
