# Frontend Engineering Report: AssetFlow ERP

This report details the accessibility parameters (A11y) and the comprehensive testing suite design for the **AssetFlow ERP** frontend.

---

## 1. Accessibility (A11y) Strategy

AssetFlow aims to meet the **WCAG 2.1 AA** accessibility standards, ensuring usability for all team members.

### 1.1 Keyboard Navigation & Focus Management
*   **Focus Ring Indicator**: All focusable interactive elements (buttons, inputs, links) use a distinct ring color:
    ```css
    focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
    ```
*   **Tab Order**: Data entry sheets and menus enforce logical tab order sequences. Modal dialogs trap focus within the overlay, returning it to the trigger element when closed.

### 1.2 ARIA Attributes
*   Dynamic screen elements use native ARIA attributes to describe their state:
    *   Dropdown menus use `aria-haspopup="true"` and toggle `aria-expanded="true|false"`.
    *   Form validation errors render with `aria-live="assertive"` so screen readers read updates immediately.
    *   Status badges include `role="status"` tags.

### 1.3 Color Contrast
*   All text styles maintain contrast ratios exceeding **4.5:1** against their background colors.
*   Warning and destructive state indicators do not rely on color alone; they display corresponding icons (e.g., an alert triangle icon) and text labels.

---

## 2. Frontend Testing Strategy

Our testing framework ensures UI stability, visual consistency, and security.

```
       [Unit: Vitest] ──> [Integration: React Testing Library] ──> [E2E: Playwright]
       - Test stores       - Test forms, modals                 - Test full workflows
       - Test custom hooks - Test API caching callbacks          - Test browser rendering
```

### 2.1 Unit Testing (Vitest)
*   **Scope**: State stores, validators, utility functions.
*   **Mocking**: Zustand store initializations are mocked before running test files.
*   **Command**:
    ```bash
    npm run test:unit
    ```

### 2.2 Integration & Component Testing (React Testing Library)
*   **Scope**: Interactivity checks (modal opens, filter selections, page pagination).
*   **Test Case Example**:
    1.  Render `<AssetForm />` wrapper.
    2.  Simulate user typing in fields.
    3.  Click "Submit".
    4.  Verify that validation triggers show error messages for empty fields.

### 2.3 End-to-End Testing (Playwright)
*   **Scope**: Full browser flows across multiple user roles.
*   **Scenario Test**:
    *   Log in as "admin".
    *   Open the asset registration page.
    *   Submit a laptop registration form.
    *   Confirm the new laptop appears in the asset directory list.
    *   Log out.
*   **Command**:
    ```bash
    npx playwright test
    ```
