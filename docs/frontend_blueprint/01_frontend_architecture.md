# Frontend Architecture Specification: AssetFlow ERP

This document outlines the frontend folder structure, module boundaries, and design patterns for the **AssetFlow ERP** web application built on React, TypeScript, and Vite.

---

## 1. Directory Tree Layout

The React application uses a modular, domain-driven structure under `src/` to ensure reusability and scalability.

```
frontend/
├── index.html                  # Main HTML entrypoint
├── package.json                # Project dependencies and script declarations
├── tailwind.config.js          # Tailwind theme configurations
├── tsconfig.json               # TypeScript path mapping config
├── vite.config.ts              # Vite bundle configurations
└── src/
    ├── main.tsx                # App bootstrap entrypoint
    ├── App.tsx                 # Root application wrapper
    ├── app/                    # Global app configuration (Providers, setup)
    ├── pages/                  # Page-level containers mapped to routing
    ├── layouts/                # Wrapper shells (Dashboard, Login paths)
    ├── components/             # Reusable UI component blocks
    │   ├── ui/                 # Atomic design blocks (shadcn copy)
    │   └── common/             # Base layouts (headers, inputs)
    ├── features/               # Feature modules (domain components, slices)
    │   ├── auth/
    │   ├── assets/
    │   ├── finance/
    │   └── audit/
    ├── hooks/                  # Global custom React hooks
    ├── services/               # Shared logic layers (e.g., date formats)
    ├── api/                    # HTTP client configuration (Axios instances)
    ├── contexts/               # Custom React Context definitions
    ├── stores/                 # Zustand state management slice folders
    ├── routes/                 # Navigation router settings
    ├── types/                  # TypeScript interface declarations
    ├── constants/              # Global values configuration
    ├── assets/                 # Local images, SVG files, and icons
    ├── utils/                  # Core utility algorithms
    ├── styles/                 # Global styles definitions
    ├── animations/             # Framer Motion custom transitions definitions
    ├── permissions/            # RBAC guards and middleware rules
    ├── notifications/          # Toast systems configuration
    └── tests/                  # Frontend test suites (Vitest, Playwright config)
```

---

## 2. Directory Responsibilities

### 2.1 `src/app/`
*   **Responsibility**: The initialization layer. Houses global providers (TanStack Query provider, Toast provider, theme provider) that wrap the root element.

### 2.2 `src/pages/`
*   **Responsibility**: Page-level containers that map directly to application routes.
*   **Constraints**: Contains no raw HTTP request logic. Pages compose feature modules and layouts together to build views.

### 2.3 `src/layouts/`
*   **Responsibility**: Structure templates (e.g., a Sidebar + Top Nav layout for internal dashboards, or a clean center card layout for login paths).

### 2.4 `src/components/ui/`
*   **Responsibility**: Reusable atomic UI elements (Buttons, Inputs, Dialogs, Selects) copied from `shadcn/ui`.
*   **Constraints**: Must remain stateless and decoupled from business logic.

### 2.5 `src/features/`
*   **Responsibility**: Domain-specific feature modules. For example, `src/features/assets/` contains components like `AssetForm.tsx`, `AssetTable.tsx`, and `AssetCard.tsx`.
*   **Rationale**: Prevents global directories from becoming cluttered and simplifies refactoring.

### 2.6 `src/hooks/`
*   **Responsibility**: Shareable, stateful custom hooks (e.g., `useAuth`, `useLocalStorage`, `useMediaQuery`).

### 2.7 `src/api/`
*   **Responsibility**: Client communication. Configures Axios interceptors to automatically append JWT access tokens to request headers and handle expired tokens.

### 2.8 `src/stores/`
*   **Responsibility**: State management using Zustand. Separated into domain slices (e.g., `authStore.ts`, `assetStore.ts`).

### 2.9 `src/permissions/`
*   **Responsibility**: Access control. Exposes helper components (like `<PermissionGuard>`) that hide or disable UI elements based on the authenticated user's role and permissions.
