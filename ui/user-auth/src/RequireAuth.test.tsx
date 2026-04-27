import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { UserAuthProvider } from './UserAuthProvider';
import { RequireAuth } from './RequireAuth';

describe('RequireAuth', () => {
  beforeEach(() => {
    cleanup();
  });

  describe('when user is not authenticated', () => {
    it('should render fallback', () => {
      render(
        <UserAuthProvider initialState={{ status: 'unauthenticated' }}>
          <RequireAuth fallback={<div>Not authenticated</div>}>
            <div>Protected content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    it('should render children when no roles required', () => {
      render(
        <UserAuthProvider
          initialState={{
            status: 'authenticated',
            user: { id: '1', roles: ['user'] },
            roles: ['user'],
          }}
        >
          <RequireAuth fallback={<div>Not authorized</div>}>
            <div>Protected content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Protected content')).toBeInTheDocument();
      expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
    });

    it('should render children when user has required role', () => {
      render(
        <UserAuthProvider
          initialState={{
            status: 'authenticated',
            user: { id: '1', roles: ['admin'] },
            roles: ['admin'],
          }}
        >
          <RequireAuth fallback={<div>Not authorized</div>} roles={['admin']}>
            <div>Admin content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Admin content')).toBeInTheDocument();
      expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks required role', () => {
      render(
        <UserAuthProvider
          initialState={{
            status: 'authenticated',
            user: { id: '1', roles: ['user'] },
            roles: ['user'],
          }}
        >
          <RequireAuth fallback={<div>Not authorized</div>} roles={['admin']}>
            <div>Admin content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
    });

    it('should render children with "any" role match when user has one required role', () => {
      render(
        <UserAuthProvider
          initialState={{
            status: 'authenticated',
            user: { id: '1', roles: ['admin'] },
            roles: ['admin'],
          }}
        >
          <RequireAuth
            fallback={<div>Not authorized</div>}
            roles={['admin', 'moderator']}
            match="any"
          >
            <div>Content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render fallback with "all" role match when user lacks one role', () => {
      render(
        <UserAuthProvider
          initialState={{
            status: 'authenticated',
            user: { id: '1', roles: ['admin'] },
            roles: ['admin'],
          }}
        >
          <RequireAuth
            fallback={<div>Not authorized</div>}
            roles={['admin', 'moderator']}
            match="all"
          >
            <div>Content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
    });
  });

  describe('when loading', () => {
    it('should render fallback by default', () => {
      render(
        <UserAuthProvider initialState={{ status: 'loading' }}>
          <RequireAuth fallback={<div>Loading...</div>}>
            <div>Protected content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should render custom loading component if provided', () => {
      render(
        <UserAuthProvider initialState={{ status: 'loading' }}>
          <RequireAuth fallback={<div>Fallback</div>} loading={<div>Custom loading</div>}>
            <div>Protected content</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Custom loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should render children when showFallbackWhenLoading is false', () => {
      render(
        <UserAuthProvider initialState={{ status: 'loading' }}>
          <RequireAuth
            fallback={<div>Fallback</div>}
            showFallbackWhenLoading={false}
          >
            <div>Protected content during loading</div>
          </RequireAuth>
        </UserAuthProvider>,
      );

      expect(screen.getByText('Protected content during loading')).toBeInTheDocument();
      expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
    });
  });
});
