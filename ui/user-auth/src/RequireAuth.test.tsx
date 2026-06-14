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
        <UserAuthProvider initialState={{ status: false }}>
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
            status: true,
            user: { id: '1', role: 'user' },
            role: 'user',
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
            status: true,
            user: { id: '1', role: 'admin' },
            role: 'admin',
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
            status: true,
            user: { id: '1', role: 'user' },
            role: 'user',
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
            status: true,
            user: { id: '1', role: 'admin' },
            role: 'admin',
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
            status: true,
            user: { id: '1', role: 'admin' },
            role: 'admin',
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
});
