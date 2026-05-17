# Chapter Admin FE — Auth + RBAC Implementation Plan

## Context

Frontend stack already in place:
- React 19 + Vite + TypeScript
- Redux Toolkit (one `counter` slice currently — auth will live in **Context**, not Redux, per requirement)
- React Query (provider wired)
- React Router v7 (with `createBrowserRouter`, see `src/navigation/routes/index.tsx`)
- axios (token interceptor reading from `localStorage.getItem("token")` already wired in `src/api/axios.ts`)
- shadcn/ui + Tailwind 4

Backend endpoints (built):
- `POST /api/auth/login`
- `POST /api/auth/complete-invite`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET  /api/permissions/catalog`
- `GET/POST/PUT/DELETE /api/{operators|superusers|admins}` + `POST .../:id/resend-invite`
- `GET/POST/PUT/DELETE /api/waitlist` (POST is public), `GET /api/stats`

---

## Architectural Principles

1. **Single source of truth for permissions** — the BE `permissions/catalog` endpoint drives the access table UI. Modules and actions added to the BE constants file automatically appear in the FE form without code changes.
2. **Declarative permission gating** — `<Can permission="x:y">…</Can>` and `useCan("x:y")` everywhere. No `if (role === "admin")` ever. The check mirrors the BE `hasPermission()` (supports `*`, `module:*`, exact).
3. **Module registry pattern for routes/sidebar** — one config file (`src/navigation/modules.ts`) declares every dashboard module: route path, sidebar label, icon, required permission, page component. The router and sidebar are both *generated* from this list. Adding a module = adding one entry.
4. **Auth state in Context, mirrored to localStorage** — Context is canonical at runtime; localStorage is the persistence layer for page reloads. The Context bootstraps from localStorage on mount, then calls `/api/auth/me` to revalidate.
5. **React Query for server state, Context only for auth identity** — admin lists, stats, permissions catalog all go through React Query (caching, invalidation, refetch). The auth context just holds `{ user, accessToken, refreshToken, isLoading }` and exposes `login/logout/refresh/setUser`.

---

## State & Persistence

### AuthContext shape

```ts
type AuthState = {
  user: CurrentUser | null;        // { id, name, email, role, access, phone, address }
  accessToken: string | null;
  refreshToken: string | null;
  status: "loading" | "authenticated" | "unauthenticated" | "must-change-password";
  firstLoginToken: string | null;  // set only when login returns mustChangePassword
};

type AuthContextValue = AuthState & {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  completeInvite(newPassword: string): Promise<void>;
  refreshAccessToken(): Promise<string | null>;
  refetchUser(): Promise<void>;
};
```

### localStorage keys

```
chapter.accessToken      // raw JWT
chapter.refreshToken     // raw JWT
chapter.user             // JSON of CurrentUser (includes access[])
```

We store `user` in localStorage so the sidebar can render before the `/me` call resolves on page load (no flash of empty navigation). We **revalidate against `/me`** immediately on mount and overwrite localStorage with the server response. If `/me` returns 401, we try refresh; if that fails, we clear everything and route to `/login`.

### Provider mounting order (in `main.tsx`)

```
<QueryProvider>
  <AuthProvider>          ← bootstraps from localStorage, calls /me
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </AuthProvider>
</QueryProvider>
```

---

## API Layer

### Axios setup (`src/api/axios.ts`)

Already wired with the request-token interceptor. We need to extend it:

1. **Response interceptor for 401 → refresh-then-retry**:
   - On 401, check if a refresh is already in-flight (single-flight pattern using a module-level `refreshPromise`).
   - If not, call `POST /api/auth/refresh` with `refreshToken` from localStorage.
   - On success, update tokens + retry the original request once.
   - On failure, clear tokens, emit an `auth:logout` event, redirect to `/login`.

2. **Don't intercept `/api/auth/*`** — login/refresh/logout endpoints must not trigger the refresh loop.

3. **Read tokens from localStorage** (already does), but expose a `setTokens(access, refresh)` helper that `AuthContext` calls so the interceptor always sees fresh values without re-reading.

### API module files (under `src/api/`)

One file per domain (mirrors existing `waitlist.ts`, `stats.ts`):

```
src/api/
  axios.ts          (existing, extended)
  auth.ts           (login, logout, refresh, me, completeInvite, requestPasswordReset, resetPassword)
  permissions.ts    (getCatalog)
  operators.ts      (list, get, create, update, remove, resendInvite)
  superusers.ts     (same)
  admins.ts         (same)
  waitlist.ts       (existing — extend to use authed endpoints)
  stats.ts          (existing)
```

Each file exports typed functions returning `Promise<T>`. No React Query inside — that lives in hooks.

### React Query hooks (`src/hooks/queries/`)

```
src/hooks/queries/
  useCurrentUser.ts       (calls /me)
  usePermissionsCatalog.ts
  useOperators.ts         (list with pagination/search params)
  useOperator.ts          (single, by id)
  useSuperusers.ts
  useSuperuser.ts
  useAdmins.ts
  useAdmin.ts
  useCreateAdmin.ts       (mutation; factory parameterized by role)
  useUpdateAdmin.ts
  useDeleteAdmin.ts
  useResendInvite.ts
```

A `makeAdminQueries(role)` factory generates the four hooks per role from a single source — mirrors the BE `makeAdminCrudController(role)`.

### Query keys convention

```
["auth", "me"]
["permissions", "catalog"]
["admins", "operator", { page, limit, search }]
["admins", "superuser", id]
```

Centralize keys in `src/hooks/queries/keys.ts` so invalidation is grep-able.

---

## Permission System (FE)

### `hasPermission` utility (`src/lib/permissions.ts`)

```ts
export const hasPermission = (userAccess: string[], required: string) => {
  if (!userAccess?.length) return false;
  if (userAccess.includes("*")) return true;
  if (userAccess.includes(required)) return true;
  const [module] = required.split(":");
  return userAccess.includes(`${module}:*`);
};
```

Identical to BE — keeps client-side checks consistent with server.

### `useCan` hook

```ts
export const useCan = (required: string) => {
  const { user } = useAuth();
  return user ? hasPermission(user.access, required) : false;
};
```

### `<Can>` component

```tsx
<Can permission="admins:create">
  <Button onClick={openCreateModal}>Invite admin</Button>
</Can>
```

Optionally accept `fallback` prop. For complex cases (e.g. multiple permissions), accept `anyOf` / `allOf` arrays.

---

## Module Registry — Routes + Sidebar From One Source

### `src/navigation/modules.ts`

```ts
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ListChecks, BarChart3, ShieldUser, Users, UserCog } from "lucide-react";

export type ModuleConfig = {
  key: string;
  path: string;
  label: string;
  icon: LucideIcon;
  requiredPermission: string | null;  // null = visible to any authenticated user
  Component: React.LazyExoticComponent<React.ComponentType>;
};

export const modules: ModuleConfig[] = [
  {
    key: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiredPermission: null,
    Component: lazy(() => import("@/pages/dashboard")),
  },
  {
    key: "waitlist",
    path: "/waitlist",
    label: "Waitlist",
    icon: ListChecks,
    requiredPermission: "waitlist:read",
    Component: lazy(() => import("@/pages/waitlist")),
  },
  {
    key: "stats",
    path: "/stats",
    label: "Stats",
    icon: BarChart3,
    requiredPermission: "stats:read",
    Component: lazy(() => import("@/pages/stats")),
  },
  {
    key: "admins",
    path: "/admins",
    label: "Admins",
    icon: Users,
    requiredPermission: "admins:read",
    Component: lazy(() => import("@/pages/admins")),
  },
  {
    key: "superusers",
    path: "/superusers",
    label: "SuperUsers",
    icon: UserCog,
    requiredPermission: "superusers:read",
    Component: lazy(() => import("@/pages/superusers")),
  },
  {
    key: "operators",
    path: "/operators",
    label: "Operators",
    icon: ShieldUser,
    requiredPermission: "operators:read",
    Component: lazy(() => import("@/pages/operators")),
  },
];
```

### Router generation (`src/navigation/routes/index.tsx`)

Replace the hardcoded children with a `modules.map(...)`. Wrap each route element in `<RequirePermission permission={m.requiredPermission}>` which uses `useCan` and redirects to `/403` (or shows an inline forbidden state) when the user lacks access.

Plus a `RequireAuth` wrapper on the dashboard layout that redirects unauthenticated users to `/login`.

### Sidebar generation (`src/navigation/Sidebar/index.tsx`)

```tsx
const allowed = modules.filter(m => !m.requiredPermission || hasPermission(user.access, m.requiredPermission));
return allowed.map(m => <SidebarItem ... />);
```

Adding a new module = adding one entry to `modules.ts`. Routes, sidebar, and access checks all update automatically.

---

## Pages

### 1. Login (`src/pages/auth/login`)

Form: email + password.

On submit:
- POST `/api/auth/login`.
- **If response has `mustChangePassword: true`** → store `firstLoginToken` in Context state, navigate to `/complete-invite`. Do **not** persist firstLoginToken to localStorage (it's a 10-min one-shot).
- **If response has 410** → show "Your invitation has expired. Contact your administrator to resend." (no redirect, stay on login).
- **If normal session tokens returned** → store in Context + localStorage, navigate to `/`.

UI: shadcn `Card` + `Input` + `Button`. "Forgot password?" link → `/forgot-password`.

### 2. Complete Invite (`src/pages/auth/complete-invite`)

Form: newPassword + confirmPassword (with strength indicator).
- Reads `firstLoginToken` from Context. If missing, redirect to `/login`.
- POST `/api/auth/complete-invite` with `{ firstLoginToken, newPassword }`.
- On 200, persist returned tokens + user, navigate to `/`.
- On 401 (token expired) → redirect to `/login` with toast "Your session expired, please log in again".

### 3. Forgot Password (`src/pages/auth/forgot-password`)

Form: email.
- POST `/api/auth/request-password-reset`.
- Always show generic success state ("If that email exists, we've sent a reset link") regardless of response.

### 4. Reset Password (`src/pages/auth/reset-password`)

Reads `?token=` from URL search params.
- Form: newPassword + confirmPassword.
- POST `/api/auth/reset-password` with `{ token, newPassword }`.
- On 200 → toast + navigate to `/login`.
- On 400 → show "This reset link is invalid or expired. Request a new one." + link to `/forgot-password`.

### 5. Dashboard Layout (`src/layouts/dashboard-layout.tsx`)

Already exists. Wrap with `<RequireAuth>`. Sidebar pulls from module registry. Top bar gets a user menu:
- Display name + role
- "Change password" → opens the change-password modal (sends `/request-password-reset` with the user's own email, shows a "Check your inbox" toast)
- "Log out" → calls `auth.logout()`, clears state + storage, navigates to `/login`

### 6. Admin Management Pages

One page per role (operators, superusers, admins). They are nearly identical — all three import a shared `<AdminManagementPage role="..." />` component which takes the role as a prop. The shared component handles:

- **List view**: table with columns name, email, role, status (Active / Invite pending / Invite expired), created at, actions. Pagination + search by name/email. Uses `useAdmins(role, { page, limit, search })` etc.
- **Row actions** (gated by `<Can>`):
  - View → opens detail drawer
  - Edit → opens edit drawer
  - Delete → confirmation dialog → `useDeleteAdmin(role)`
  - Resend invite → shown only when row has `inviteExpiresAt` and `mustChangePassword: true`; calls `useResendInvite(role)`
- **Create button** (top right, gated by `<Can permission="{role}:create">`): opens 2-step wizard.

### 7. Create Admin — 2-Step Wizard

Implemented as a single component `<CreateAdminWizard role={...} />` (drawer or dialog).

**Step 1: Basic info**
- name (required)
- email (required, email validation)
- password (required, min 8 chars, strength indicator)
- phone (optional)
- address (optional)
- role is **fixed** by which page you're on — pre-filled, read-only display

Submit "Next" → validates locally → moves to Step 2.

**Step 2: Access**
- Fetch `usePermissionsCatalog()` (cached forever by React Query; stale-time: Infinity).
- Render a table:
  ```
  | Module      | ALL | WRITE | READ | DELETE |
  |-------------|-----|-------|------|--------|
  | Dashboard   |  ☐  |  ☐    |  ☐   |   ☐    |
  | Waitlist    |  ☐  |  ☐    |  ☐   |   ☐    |
  | Stats       |  ☐  |  ☐    |  ☐   |   —    |  ← stats has no delete
  | Admins      |  ☐  |  ☐    |  ☐   |   ☐    |
  | ...                                       |
  ```
- Column semantics (FE-side mapping; BE keeps 4 granular actions):
  - **ALL** → adds `module:*` to selection, disables other columns for that row
  - **WRITE** → adds `module:create` AND `module:update`
  - **READ** → adds `module:read`
  - **DELETE** → adds `module:delete`
- Disable any action a module doesn't expose (catalog returns the actions array per module).
- **Filter the catalog by what the creator can grant** — for each module/action, only show the row/column if `hasPermission(currentUser.access, "module:action")`. This makes the privilege-escalation subset rule visible in the UI before the server enforces it.
- **"Use role defaults"** quick-action button that pre-fills the selection from `catalog.defaultAccess[role]`.

Submit "Create" → translate the selection into a flat `string[]` of permissions (collapse `module:create + module:update` selected → keep both individually; or if both create+read+update+delete selected → simplify to `module:*`) → POST to `/api/{role}s`.

### 8. Edit Admin

Same wizard but step 1 is the user's existing fields (password field hidden — not editable; show "Reset password" button that calls `request-password-reset` with the target user's email instead). Step 2 pre-populated from existing `access`.

### 9. Change Password (in-app)

Top-bar menu → "Change password" → modal with single button: "Send reset link to my email". Click → calls `/api/auth/request-password-reset` with the current user's email → toast "Check your email" → close.

(Per Q4 answer, no direct change-password endpoint. Email link flow only.)

---

## Token Refresh Strategy

**Where**: `src/api/axios.ts` response interceptor.

**Algorithm**:
```
on error response 401:
  if request URL starts with /api/auth/ → reject (don't loop)
  if request is already retried (config._retry) → reject
  mark request as retried
  if there's no module-level refreshPromise:
    refreshPromise = POST /api/auth/refresh with refreshToken
  await refreshPromise
  if it succeeded:
    update tokens in localStorage + emit auth:tokens-updated event
    retry original request with new access token
  else:
    clear tokens + emit auth:logout event
    reject

once refreshPromise resolves (success or failure):
  refreshPromise = null
```

**Auth context listens for** `auth:logout` and `auth:tokens-updated` events to keep its state synced with what the interceptor did.

This single-flight design ensures that 5 parallel requests that all 401 don't trigger 5 refresh calls — they all wait on the same promise.

---

## Error Handling Conventions

- **401** (not in /auth/*): interceptor handles automatically (refresh + retry, or logout).
- **403**: show inline forbidden state on the page; do not redirect. The user has navigated somewhere they shouldn't see, but they're logged in.
- **410** on login: shown on login page as "Invitation expired" with a hint to contact admin.
- **400 on reset-password**: show "Link invalid or expired" with link back to forgot-password.
- **Network errors**: generic toast "Network error, please try again".
- All API errors go through a single `extractApiError(error)` helper that returns `{ status, message }` so toasts/forms stay consistent.

---

## Proposed File Structure (additions only)

```
src/
  api/
    auth.ts                              (new)
    permissions.ts                       (new)
    operators.ts                         (new)
    superusers.ts                        (new)
    admins.ts                            (new)
    axios.ts                             (extend: response interceptor for refresh)
  app/
    providers/
      auth-provider.tsx                  (new — AuthContext + useAuth)
  hooks/
    queries/
      keys.ts                            (new — query key constants)
      useCurrentUser.ts                  (new)
      usePermissionsCatalog.ts           (new)
      useAdminsQueries.ts                (new — factory: makeAdminQueries(role))
  lib/
    permissions.ts                       (new — hasPermission + types)
    api-error.ts                         (new — extractApiError)
  components/
    common/
      Can.tsx                            (new)
      RequireAuth.tsx                    (new)
      RequirePermission.tsx              (new)
  navigation/
    modules.ts                           (new — single source of truth for modules)
    routes/index.tsx                     (rewrite: generated from modules.ts)
    Sidebar/                             (rewrite: generated from modules.ts)
  pages/
    auth/
      login/                             (extend — wire to BE)
      complete-invite/                   (new)
      forgot-password/                   (new)
      reset-password/                    (new)
    admins/                              (new)
      index.tsx
      components/
        AdminTable.tsx
        CreateAdminWizard.tsx            (used by all 3 roles)
        EditAdminDrawer.tsx
        AccessTableField.tsx             (the catalog-driven access matrix)
    superusers/index.tsx                 (new — uses shared AdminManagementPage)
    operators/index.tsx                  (new — same)
    stats/                               (new — protected stats page)
  layouts/
    dashboard-layout.tsx                 (extend — wrap with RequireAuth, user menu)
```

The shared `<AdminManagementPage role={...}>` component lives under `pages/admins/components/` (or hoisted to `components/common/`) and is imported by all three role pages.

---

## Implementation Order

Build in this sequence so each step is independently testable:

1. **Foundation**
   - `lib/permissions.ts` (hasPermission utility + types)
   - `lib/api-error.ts`
   - Extend `api/axios.ts` (response interceptor + refresh single-flight)
2. **Auth**
   - `api/auth.ts` (typed wrappers for the 7 endpoints)
   - `app/providers/auth-provider.tsx` (Context + bootstrap from localStorage + /me revalidate + login/logout/refresh)
   - Mount AuthProvider in `main.tsx`
   - `hooks/queries/useCurrentUser.ts`
3. **Routing skeleton**
   - `components/common/RequireAuth.tsx` and `RequirePermission.tsx`
   - `navigation/modules.ts` (stub with just dashboard + login)
   - Rewrite `navigation/routes/index.tsx` to generate from modules
   - Rewrite Sidebar to generate from modules
4. **Permission primitives**
   - `components/common/Can.tsx`
   - `hooks/queries/usePermissionsCatalog.ts`
5. **Auth pages**
   - Wire existing Login page to `api/auth.ts`, handle `mustChangePassword` and 410 branches
   - Build `complete-invite`, `forgot-password`, `reset-password` pages
   - Logout + change-password from top-bar menu
6. **Admin management**
   - `api/{operators,superusers,admins}.ts` (CRUD + resendInvite)
   - `hooks/queries/useAdminsQueries.ts` factory
   - Shared `<AdminManagementPage role>` with list + table
   - `<CreateAdminWizard>` two-step + `<AccessTableField>` driven by `usePermissionsCatalog`
   - Edit drawer + Delete confirm + Resend invite action
   - Three thin pages (`pages/admins`, `pages/superusers`, `pages/operators`) instantiate the shared component with their role
7. **Existing pages**
   - Re-wire `pages/waitlist` to authed endpoints (read/update/delete now require auth)
   - Add `pages/stats` (gated by `stats:read`)
8. **Polish**
   - 403 page / inline forbidden states
   - Loading skeletons for permission-pending UI
   - Toast notifications on mutation success/failure

---

## Open Questions for FE

- **403 behavior**: dedicated `/403` route, or inline forbidden card on each page? *Recommend inline.*
- **Password strength UI**: simple length+character check or a library like `zxcvbn`? *Recommend simple in-house check; matches BE min-length-8.*
- **List page UX for invite-pending users**: status badge ("Pending invite") + a tooltip showing expiry time + a "Resend invite" row action when expired. Sounds right?
- **Should the auth context expose `accessToken` to consumers**, or should consumers only ever talk to the API client and let the interceptor handle tokens? *Recommend the latter — keep tokens out of components entirely; only `auth.ts` and `auth-provider.tsx` touch them.*

---

## Required env on FE

```
VITE_API_BASE_URL=http://localhost:4500
```

(`axios.ts` already reads this.)

---

## What the BE supports today (recap)

Everything this plan calls is implemented and type-checked on the BE. Specifically:

- Catalog endpoint returns `{ wildcard, actions, modules: [{ key, label, actions, wildcard }], defaultAccess }` — enough for the access table UI.
- Privilege-escalation subset rule is enforced server-side, so even if the FE filtering breaks the BE will return 403 with a specific permission name in the error — the wizard should surface that message inline.
- `/api/auth/me` returns the full user (incl. name/phone/address/access) for refetch-on-mount.
- Login returns differentiated responses for normal / first-login / expired-invite.
- Admin create accepts `name, email, password, phone, address, access`.
