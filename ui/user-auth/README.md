# @vassembly/ui-user-auth

Client-side authentication state management and role-based access control for React applications.

## Overview

This package provides a React Context-based authentication system that manages user session state and provides declarative gating components for protecting routes and UI elements based on authentication status and user roles.

## Installation

```bash
pnpm add @vassembly/ui-user-auth
```

## Usage

### Setup

Wrap your app with the `UserAuthProvider` at the root:

```tsx
import { UserAuthProvider } from '@vassembly/ui-user-auth';

export function App() {
  return (
    <UserAuthProvider>
      {/* Your app components */}
    </UserAuthProvider>
  );
}
```

### Access Authentication State

Use the `useUserAuth` hook anywhere in your component tree:

```tsx
import { useUserAuth } from '@vassembly/ui-user-auth';

export function UserProfile() {
  const { user, isAuthenticated, status, roles } = useUserAuth();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.email}</div>;
}
```

### Update Session State

Use the context methods to update authentication state after login/logout:

```tsx
import { useUserAuth } from '@vassembly/ui-user-auth';

export function LoginForm() {
  const { setSession, clearSession } = useUserAuth();

  const handleLogin = async (email: string, password: string) => {
    const response = await loginAPI(email, password);
    
    setSession({
      user: {
        id: response.userId,
        email: response.email,
        roles: response.roles,
      },
    });
  };

  const handleLogout = () => {
    clearSession();
  };

  return (
    <>
      {/* form JSX */}
    </>
  );
}
```

### Protect Content with RequireAuth

Declaratively protect routes and UI sections:

```tsx
import { RequireAuth } from '@vassembly/ui-user-auth';

export function Dashboard() {
  return (
    <RequireAuth
      fallback={<div>Please log in to access the dashboard</div>}
    >
      <div>Dashboard content</div>
    </RequireAuth>
  );
}
```

### Role-Based Access Control

Restrict content to users with specific roles:

```tsx
import { RequireAuth } from '@vassembly/ui-user-auth';

export function AdminPanel() {
  return (
    <RequireAuth
      roles={['admin']}
      fallback={<div>You do not have permission to access this</div>}
    >
      <div>Admin panel content</div>
    </RequireAuth>
  );
}
```

**Multiple roles with `any` match (default)**:

```tsx
<RequireAuth
  roles={['admin', 'moderator']}
  fallback={<div>Insufficient permissions</div>}
>
  <div>Staff only content</div>
</RequireAuth>
```

**Multiple roles with `all` match**:

```tsx
<RequireAuth
  roles={['admin', 'staff']}
  match="all"
  fallback={<div>You must have both admin and staff roles</div>}
>
  <div>Admin staff content</div>
</RequireAuth>
```

### Imperative Authorization Checks

Use `useIsAuthorized` for imperative checks (e.g., conditionally disabling buttons):

```tsx
import { useIsAuthorized } from '@vassembly/ui-user-auth';

export function AdminButton() {
  const isAdmin = useIsAuthorized(['admin']);

  return (
    <button disabled={!isAdmin}>
      Admin action
    </button>
  );
}
```

### Loading State

Handle loading states while bootstrapping the session:

```tsx
import { useUserAuth } from '@vassembly/ui-user-auth';

export function App() {
  const { setStatus, setSession } = useUserAuth();

  useEffect(() => {
    const bootstrap = async () => {
      setStatus('loading');
      
      try {
        const user = await fetchCurrentUser();
        setSession({
          user: {
            id: user.id,
            email: user.email,
            roles: user.roles,
          },
        });
      } catch (error) {
        // User not authenticated
      }
    };

    bootstrap();
  }, []);

  return <>...</>;
}
```

**Configure loading behavior in `RequireAuth`**:

```tsx
<RequireAuth
  fallback={<div>Not authenticated</div>}
  loading={<div>Checking authentication...</div>}
  showFallbackWhenLoading={true}
>
  <div>Protected content</div>
</RequireAuth>
```

## API Reference

### `UserAuthProvider`

Component that provides authentication context to the app.

**Props:**
- `children` - React children
- `initialState` (optional) - Initial auth state for SSR/testing

### `useUserAuth`

Hook to access authentication state and methods.

**Returns:**
- `status` - `'loading' | 'authenticated' | 'unauthenticated'`
- `user` - Current user object or `null`
- `roles` - Array of user role strings
- `isAuthenticated` - Boolean indicating if user is authenticated
- `setSession(params)` - Set authenticated user and roles
- `clearSession()` - Clear authentication state
- `setStatus(status)` - Set loading state

### `RequireAuth`

Component that conditionally renders children based on authentication.

**Props:**
- `children` - Content to render if authenticated and authorized
- `fallback` - Content to render if not authenticated/authorized
- `roles` (optional) - Required user roles
- `match` (optional) - Role matching strategy: `'any'` (default) or `'all'`
- `loading` (optional) - Content to render while loading
- `showFallbackWhenLoading` (optional) - Show fallback while loading (default: `true`)

### `useIsAuthorized`

Hook for imperative authorization checks.

**Parameters:**
- `requiredRoles` (optional) - Array of required roles
- `match` (optional) - Role matching strategy: `'any'` (default) or `'all'`

**Returns:**
- Boolean indicating if user is authorized

## Security

⚠️ **Important**: Client-side authentication gating is for **UX only**. All real authorization must be enforced on the server. Never rely on this package for security-critical access control.

## Architecture

- **Headless API**: This package manages session state but does not dictate how you authenticate. Integrate with your login API via the app or a separate module.
- **React Context**: Uses React 18+ Context API for simple, efficient state distribution.
- **No dependencies**: Only depends on React (peer dependency).

## Naming Note

This package uses `useUserAuth` (not `useAuth`) to avoid collision with the `useAuth` mutation hook in `@vassembly/ui-api-hooks`.
