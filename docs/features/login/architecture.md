# Login flow — architecture

**Status:** Implementation reference  
**Last updated:** 2026-05-05  
**Related:** [PRD](./prd.md) · [Reset password architecture](../reset-password/architecture.md) (adjacent auth flows)

This document describes how email/password login is implemented end-to-end in the Vassembly monorepo: Next.js UI, REST gateway, auth service orchestration, user credential verification, token issuance, and client session/bootstrap behavior.

---

## Analysis

### Web app (`apps/web`, `@vassembly/web`)

| Concern | Location | Role |
|---------|----------|------|
| Login route | `app/login/page.tsx` | Client page: reads `returnUrl` from search params, wraps content in `ProtectedAuthRoute` + `Suspense`, passes `LoginForm` callbacks (`onRedirect` → `router.replace`, `onSuccess` → `setTokens`). |
| Token persistence | `lib/auth/sessionStorage.ts` | **localStorage** keys `auth:token` and `auth:refreshToken`; sets an **HTTP cookie** for the access token (`auth-token`, `path=/`, `SameSite=Strict`). Clears LS + cookie on `clearTokens`. |
| Route guard | `lib/auth/ProtectedAuthRoute.tsx` | When `requireAuthenticated` is false (login page), redirects **away** if `useUserAuth().isAuthenticated` (default `redirectPath`: `/`). |
| Session restore | `lib/auth/SessionBootstrap.tsx` | On mount: if both tokens exist, calls `useAuth` → `POST /auth`; on success refreshes tokens and `setSession` with user + role from API; on failure clears tokens + session. |
| App shell | `app/providers.tsx` | `HttpClientProvider` / `GraphQLProvider` wired with `getAuthTokenForHeader` / `getRefreshTokenForHeader` from `sessionStorage`; `UserAuthProvider` → `SessionBootstrap` → `SnackbarProvider`. |
| Edge redirects | `middleware.ts` | If path is an **auth page** and a cookie signals a session, redirect to `/`. **Note:** cookie name in middleware (`authToken`) must match the name set in `sessionStorage` (`auth-token`) for this to work (see §Librarian/consistency notes). |

### UI — `@vassembly/ui-login-form` (`ui/components/login-form/`)

| Asset | Responsibility |
|-------|----------------|
| `src/LoginForm.tsx` | Presentational form: email + password, links to `/register` and `/forgot-password`, submit loading/`aria-busy`. |
| `src/useLoginForm.ts` | Composes `useLogin` (`@vassembly/ui-api-hooks`), `useUserAuth`, `useSnackbar`; client validation via `validateLoginForm`; submits trimmed email/password; wires `useLoginFormCompletionEffect`. |
| `src/validateLoginForm.ts` | Zod: required email (format), required password (non-empty after trim). |
| `src/useLoginFormCompletionEffect.ts` | On fetch completion: maps API errors through `formatLoginErrorMessage`; on success: `mapLoginUserToAuthUser` → `setSession({ user, status: 'authenticated' })`, `onSuccess` (host persists tokens), success snackbar, `resolvePostLoginTargetUrl` → `onRedirect` or `window.location`. |
| `src/resolvePostLoginTargetUrl.ts` | **Open-redirect guard:** `returnUrl` parsed with page `origin`; must match same origin; disallows odd protocols/pathnames; falls back to `fallbackPath`. |
| `src/formatLoginErrorMessage.ts` | Maps `@vassembly/errors` shapes to PRD-aligned copy (generic credential failure, timeout, network, etc.). |
| `src/mapLoginUserToAuthUser.ts` | Maps API user to `AuthUser` (`id`, `email`, `firstName`, `lastName` — **no `role` in login mapper**; role is populated on `POST /auth` during `SessionBootstrap` or other flows). |

### API gateway (`apps/api`, `@vassembly/api`)

| Asset | Responsibility |
|-------|----------------|
| `src/routes/user/login.ts` | `POST` route path segment `/login` under `/user` prefix → **`POST /user/login`**. Zod body: `{ email: string, password: string }`. Handler: `handlers.login(body)` from `@vassembly/service-auth`. |
| `src/routes/index.ts` | Registers `userRoutes` with `routesWithPrefix("/user", [loginRoute, ...])`. |

### Auth service — `@vassembly/service-auth` (`services/auth/`)

| Asset | Responsibility |
|-------|----------------|
| `src/handlers/login/index.ts` | **Orchestration:** `userDomain.queries.verify({ email, password })` → `refreshTokenDomain.commands.create({ userId })` → `authTokenDomain.commands.create({ input: { userId, refreshTokenId, role: 'user' } })`. Returns `{ user, authToken, refreshToken }`. Throws `InternalError` if token creation or user id is missing after verify. |
| `src/handlers/login/types.ts` | `LoginInput` / `LoginOutput`; user type `UserPublicResponse` from domain. |

### User domain — `@vassembly/domain-user` (`domains/user/`)

| Asset | Responsibility |
|-------|----------------|
| `src/queries/verifyCredentials/index.ts` | **Exported as `queries.verify`** (folder name `verifyCredentials`). `getByEmail` with `includePasswordHash: true`; if missing user or missing `passwordHash`, or `compareHash` fails → `UnauthorizedError` with message **"Invalid email or password"** (enumeration-safe). Strips `passwordHash` before returning `UserPublicResponse`. |
| `src/model/model.ts` | `UserModel` / `UserPublicResponse`: public shape excludes secrets; includes `email`, names, `verifiedAt`, etc. |

### Token domains

| Package | Role in login |
|---------|----------------|
| `@vassembly/domain-refresh-token` | `commands.create({ userId })` — persistent refresh token for session continuity. |
| `@vassembly/domain-auth-token` | `commands.create({ input: { userId, refreshTokenId, role } })` — short-lived access token bound to refresh token row. |

### Client hooks — `@vassembly/ui-api-hooks` (`ui/api-hooks/`)

| Asset | Responsibility |
|-------|----------------|
| `src/auth/useLogin.ts` | `useFetch` + `httpClient.post({ path: '/user/login', body })`; response type: `user` + `authToken` + `refreshToken`. |
| `src/auth/useAuth.ts` | Used by `SessionBootstrap`: validates/refreshes session via `POST /auth` with token headers (see `@vassembly/constants` / API auth route). |

### Auth context — `@vassembly/ui-user-auth` (`ui/user-auth/`)

- **`UserAuthProvider` / `useUserAuth`:** in-memory session (`user`, `isAuthenticated`, `role`, `setSession`, `clearSession`). No HTTP or storage — consumers combine with `sessionStorage` + hooks.

---

## Architecture & package placement

### Layer diagram (logical)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/web                                                                     │
│  middleware ──► auth pages redirect if cookie (intended)                   │
│  app/login/page ──► LoginForm ──► onSuccess: setTokens; router.replace     │
│  Providers ──► HttpClient + GraphQL + UserAuth + SessionBootstrap          │
└─────────────────────────────────────────────────────────────────────────────┘
        │ POST /user/login                          │ POST /auth (bootstrap)
        ▼                                             ▼
┌───────────────────┐                       ┌───────────────────┐
│ apps/api          │                       │ apps/api          │
│ routes/user/login │                       │ routes/auth/auth  │
└─────────┬─────────┘                       └─────────┬─────────┘
          │ handlers.login                             │ handlers.auth
          ▼                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ @vassembly/service-auth                                                       │
│ login: verify → refresh token create → auth token create                      │
└─────────────────────────────────────────────────────────────────────────────┘
          │                          │                    │
          ▼                          ▼                    ▼
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ domain-user     │    │ domain-refresh-token │    │ domain-auth-token   │
│ queries.verify  │    │ commands.create      │    │ commands.create       │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### Data flow (happy path)

1. User submits email/password on `/login` (optional `?returnUrl=`).
2. `LoginForm` → `useLogin.fetch` → **`POST /user/login`** with JSON body.
3. API route validates shape → **`handlers.login`**.
4. **Verify:** domain loads user, compares password with **`@vassembly/client-encoder`** `compareHash`; returns public user or **`UnauthorizedError`**.
5. **Tokens:** new refresh token row, then auth token embedding `userId`, `refreshTokenId`, **`role: 'user'`**.
6. Response JSON: `{ user, authToken, refreshToken }`.
7. Client completion effect: **`setSession`** (in-memory), host **`onSuccess`** → **`setTokens`** (localStorage + cookie), success snackbar, **`resolvePostLoginTargetUrl`** → **redirect**.

---

## Component breakdown (by path)

| Path | Responsibility |
|------|----------------|
| `apps/web/app/login/page.tsx` | Login page: `returnUrl`, token persistence callback, navigation. |
| `apps/web/lib/auth/sessionStorage.ts` | Token read/write; cookie for access token. |
| `apps/web/lib/auth/ProtectedAuthRoute.tsx` | Hide login UI when already authenticated (client-side). |
| `apps/web/lib/auth/SessionBootstrap.tsx` | Restore session from stored tokens via `/auth`. |
| `apps/web/app/providers.tsx` | Global clients + auth context + bootstrap. |
| `apps/web/middleware.ts` | Edge redirect off auth pages when logged in (cookie-based). |
| `apps/api/src/routes/user/login.ts` | REST adapter for login. |
| `services/auth/src/handlers/login/index.ts` | Login use-case orchestration. |
| `domains/user/src/queries/verifyCredentials/index.ts` | Credential verification and public user projection. |
| `domains/user/src/queries/getByEmail.ts` | Email lookup (used by verify). |
| `ui/api-hooks/src/auth/useLogin.ts` | Login mutation hook. |
| `ui/api-hooks/src/http/useFetch.ts` | Generic fetch state + error capture for hooks. |
| `ui/components/login-form/src/*.ts(x)` | Form UX, validation, redirect policy, error copy. |

---

## Data models and types

### Request / response (REST)

- **Request:** `POST /user/login` body `{ email: string, password: string }` (strings accepted by Zod; trimming happens on client before send).
- **Success body:** `{ user: UserPublicResponse, authToken: string, refreshToken: string }` — `UserPublicResponse` from `@vassembly/domain-user` (no password hash).
- **Errors:** `@vassembly/server` error handler maps thrown `@vassembly/errors` `CommonError` instances to HTTP status + JSON `{ type, message, error }`.

### Client types

- **`@vassembly/ui-user-auth` `AuthUser`:** `id`, optional `email`, `firstName`, `lastName`, `role`, `verifiedAt`, `isSsoOnly`.
- **Login mapper** supplies `id`, `email`, `firstName`, `lastName`; **`role` may be unset** until `/auth` bootstrap or profile loads.

---

## Error handling and validation

| Layer | Behavior |
|-------|----------|
| Client | Zod validation in `validateLoginForm`; errors as snackbar (field-level message from first issue). |
| Domain | Single message for all credential failures: **`UnauthorizedError("Invalid email or password")`** — no distinction between unknown email and wrong password. |
| Service | **`InternalError`** if verify returns unusable `id` or token issuance fails (server-side failure, not wrong password). |
| API | Validation errors → **`WrongParamError`** via `@vassembly/server` if body schema fails. |
| UI mapping | `formatLoginErrorMessage`: timeout, `statusCode === 0`, unauthorized/not-found → generic sign-in failure copy; network hints → connectivity copy; else generic retry. |

---

## Security considerations

| Area | Implementation / note |
|------|------------------------|
| Password comparison | Only in **`domain-user`** via **`compareHash`**; plaintext password not stored; hash stripped before response. |
| Enumeration | Same error path for missing user, missing hash, and bad password; client copy does not distinguish. |
| TLS | Assumed for production API base URL (client config today uses dev URL in `providers.tsx` — env/config should follow deployment). |
| Session fixation | Login issues **new** refresh + auth token pair (not reusing prior anonymous credentials). |
| Open redirects | **`resolvePostLoginTargetUrl`** restricts `returnUrl` to same origin with safe protocol. |
| Token storage | Access + refresh in **localStorage**; access token also mirrored to cookie for middleware **when names align**; consider threat model (XSS vs CSRF) for long-term hardening beyond this doc. |
| Logging | Avoid logging passwords or tokens; note **`getAuthTokenForHeader`** currently logs tokens in dev — should be removed for production hygiene. |
| Rate limiting | PRD recommends brute-force protection at gateway/platform — not implemented in domain handler alone. |

---

## State management and session handling

| Mechanism | Role |
|-----------|------|
| **`UserAuthProvider`** | Source of truth for **“is the user signed in?”** and **`user`** in React; updated on login success and after `/auth` bootstrap. |
| **localStorage + cookie** | Persists tokens across reloads; `SessionBootstrap` re-validates via **`POST /auth`** and refreshes token pair. |
| **`ProtectedAuthRoute`** | Prevents showing login/register when `isAuthenticated` (client). |
| **`middleware`** | Optional extra guard at edge using cookie (must match client cookie name). |

**Order on successful login (client):** `setSession` → `onSuccess` / `setTokens` → snackbar → `onRedirect` (`useLoginFormCompletionEffect`).

---

## Dependencies between packages

```
apps/web
  → ui-login-form, ui-api-hooks, ui-user-auth, ui-snackbar (+ Next.js)

ui-login-form
  → ui-api-hooks, ui-user-auth, ui-snackbar, ui-button, ui-text-field, ui-text, ui-utils, validation, errors

ui-api-hooks
  → (http client context; base URL from host)

apps/api
  → @vassembly/server, @vassembly/service-auth, zod, config

services/auth (login handler)
  → domain-user, domain-auth-token, domain-refresh-token, errors

domain-user (verify)
  → client-encoder (compareHash), errors, mongodb DAO / getByEmail
```

---

## Sequence diagram (login)

```
User          LoginForm/useLoginForm    API (/user/login)    service-auth.login    domain-user.verify    refresh-token    auth-token
  │                    │                        │                      │                    │                  │ create         │ create
  │── submit ─────────►│                        │                      │                    │                  │                │
  │                    │── POST {email,pwd} ───►│                      │                    │                  │                │
  │                    │                        │── handlers.login ───►│                    │                  │                │
  │                    │                        │                      │── verify ─────────►│                  │                │
  │                    │                        │                      │◄─ UserPublic ──────│                  │                │
  │                    │                        │                      │── create ───────────────────────────────►│                │
  │                    │                        │                      │◄─ refreshToken ───────────────────────────│                │
  │                    │                        │                      │── create ───────────────────────────────────────────────►│
  │                    │                        │                      │◄─ authToken ──────────────────────────────────────────────│
  │                    │                        │◄─ {user,tokens} ─────│                    │                  │                │
  │                    │◄─ JSON ────────────────│                      │                    │                  │                │
  │                    │ setSession + setTokens + redirect             │                    │                  │                │
```

---

## Recommendation

- Treat **`handlers.login`** + **`queries.verify`** as the single source of truth for credential policy; keep UI validation aligned but minimal (format/required only).
- Prefer **one cookie name** shared by `middleware.ts` and `sessionStorage.ts` so edge and client agree on “logged in”.
- Keep **login** on **REST** (`/user/login`) as today; use **GraphQL** for post-login data (`useGetUser`, etc.) per existing app patterns.
- For production **`Providers`**, move **API base URL** from hardcoded localhost to config/env consistent with `@vassembly/config` / Next env.

---

## Librarian/consistency notes

- **Cookie name mismatch:** `middleware.ts` reads **`authToken`**; `sessionStorage.ts` sets **`auth-token`** — middleware may not observe the client cookie; align names or document intentional separation.
- **Naming:** PRDs and folders may say **verifyCredentials**; domain default export surface is **`queries.verify`** (`domains/user/src/queries/verifyCredentials/`).
- **File name `sessionStorage`:** implementation uses **localStorage** (and cookie), not `window.sessionStorage`.
- Adjacent flows: **register** mirrors the same service pattern; **reset password** and **forgot password** touch `/user/*` routes; **session refresh** is centralized in **`handlers.auth`** and **`SessionBootstrap`**.
