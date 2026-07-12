# React Authentication & Security Plan: AssetFlow ERP

This document specifies the React authentication contexts, role guards, token storage rules, and session timeout components for **AssetFlow ERP**.

---

## 1. Frontend Route Guard Architecture

We use **React Router v6** to enforce authentication checks before rendering protected routes.

```
       [Routing Request]
               │
               ▼
      [ProtectedRoute]
     /                \
(Authenticated)     (Anonymous)
   /                    \
  ▼                      ▼
[RoleGuard] ──(Fail)──> [Forbidden Page]
  │ (Pass)
  ▼
[Render Target Page]
```

### 1.1 `ProtectedRoute` Component
*   **Purpose**: Redirects unauthenticated users to the `/login` route.
*   **TypeScript Signature**:
    ```typescript
    interface ProtectedRouteProps {
      children: React.ReactNode;
    }
    ```
*   **Logic**: Checks `isAuthenticated` in `useAuthStore`. If false, redirects to `/login` using the router redirect component, saving the current location path to redirect back after login.

---

## 2. Component-Level Permission Guards

To hide UI actions (like buttons or tabs) from unauthorized roles:

### 2.1 `PermissionGuard`
*   **Purpose**: Renders child components only if the current user has the required permission codes.
*   **TypeScript Signature**:
    ```typescript
    interface PermissionGuardProps {
      permissions: string[];
      fallback?: React.ReactNode;
      children: React.ReactNode;
    }
    ```
*   **Usage Pattern**:
    ```tsx
    <PermissionGuard permissions={["asset:create"]} fallback={<p>Locked</p>}>
      <Button onClick={handleAddAsset}>Add Asset</Button>
    </PermissionGuard>
    ```

---

## 3. Secure Token Storage & Axios Interceptors

To mitigate token theft (XSS/CSRF):
1.  **Access Token Storage**: Stored in application memory (Zustand state). It is never saved to `localStorage` or `sessionStorage`.
2.  **Axios Interceptor**: Appends the Bearer token to outgoing API requests:
    ```typescript
    api.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    ```
3.  **Automatic Refresh**: If an API request returns an `HTTP 401 Unauthorized` status (indicating an expired access token), the interceptor:
    *   Pauses outgoing requests.
    *   Sends a `POST /api/v1/auth/refresh` request.
    *   If successful, updates the access token and retries the original request.
    *   If the refresh token is also expired or invalid, it clears the local session and redirects the user to `/login`.

---

## 4. Session Timeout warning UI

To prevent active session vulnerability when a user leaves their browser unattended:
*   **Inactivity Tracker**: A custom React hook (`useActiveSession`) monitors mouse movements, key presses, and scrolls.
*   **Countdown Alert**: If no activity is detected for **13 Minutes**, a modal dialog is displayed:
    *   "Session Expiring: You have been inactive. For your security, you will be logged out in 2 minutes."
    *   Displays a 120-second countdown timer.
    *   Offers two actions:
        1.  `Extend Session`: Sends a refresh request, resets the inactivity timer, and closes the modal.
        2.  `Log Out`: Calls `/auth/logout`, clears local session variables, and redirects to `/login`.
