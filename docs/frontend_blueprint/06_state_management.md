# State Management Blueprint: AssetFlow ERP

This document outlines the state management design, caching rules, and data synchronization patterns for the **AssetFlow ERP** frontend.

---

## 1. State Management Architecture

AssetFlow splits client state into three categories to ensure stability and clean separation of concerns:

```
                  ┌───────────────────────┐
                  │   Client Application  │
                  └───────────┬───────────┘
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
[Local Component State] [Global UI State]    [Server Cache State]
- useState / useReducer - Zustand Stores     - TanStack Query
- Form inputs, dialogs  - Sidebar status     - Asset lists, profiles
```

---

## 2. Global UI State: Zustand Stores

Global client-side UI states are managed via **Zustand** stores, separated into modular slices:

### 2.1 `useAuthStore`
*   **State Variables**:
    *   `accessToken`: `string | null`
    *   `user`: `UserProfile | null`
    *   `isAuthenticated`: `boolean`
*   **Actions**:
    *   `setSession(token, user)`: Sets active session parameters.
    *   `clearSession()`: Clears tokens and redirects to `/login`.

### 2.2 `useUIStore`
*   **State Variables**:
    *   `sidebarOpen`: `boolean`
    *   `theme`: `'light' | 'dark'`
    *   `commandPaletteOpen`: `boolean`
*   **Actions**:
    *   `toggleSidebar()`: Opens or closes the sidebar.
    *   `toggleTheme()`: Switches colors mode variables.

---

## 3. Server Cache State: TanStack Query

We use **TanStack Query** (React Query) to manage API data fetching, caching, and state synchronization:

### 3.1 Caching Configuration Rules
*   **`staleTime`**: Set to **5 Minutes** (`300000ms`) for general lists (like assets and locations) to minimize redundant API calls. Set to **0** for critical queues (like pending transfer approvals).
*   **`gcTime`**: Set to **30 Minutes** to preserve historical queries in cache memory before garbage collection.
*   **`refetchOnWindowFocus`**: Disabled (`false`) for form views, but enabled for dashboards and lists to ensure data freshness.

---

## 4. Optimistic Updates & Error Rollbacks

For highly interactive states (like toggling an asset's condition or approving a transfer request):

1.  **Trigger**: The user clicks "Approve Transfer".
2.  **State Update**: The query cache is updated immediately to show the transfer as approved.
3.  **API Call**: The application sends the patch request to the API in the background.
4.  **Rollback on Failure**: If the API call fails, the mutation's `onError` callback rolls back the cache to its previous state and displays a warning toast.

---

## 5. Offline Data Synchronization

To support audits in locations with limited or zero internet connectivity:

1.  **Active Cache Store**: When an auditor initiates an audit cycle, the system pre-caches the list of target assets using **IndexedDB** or `localStorage`.
2.  **Request Queue**: When offline, verification inputs are saved to a local array:
    ```typescript
    interface OfflineMutation {
      id: string;
      endpoint: string;
      payload: any;
      timestamp: number;
    }
    ```
3.  **Synchronization Trigger**: A global window event listener monitors internet connectivity:
    ```typescript
    window.addEventListener('online', triggerSyncQueue);
    ```
    Once connection is restored, the queue is processed sequentially, sending mutations back to the FastAPI backend.
