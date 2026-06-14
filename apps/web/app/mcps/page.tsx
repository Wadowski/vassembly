'use client';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { McpsPageView } from './McpsPageView';
import { McpsSkeleton } from './_components/McpsSkeleton/McpsSkeleton';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/mcps')}`;

export default function McpsPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE} loadingFallback={<McpsSkeleton />}>
      <McpsPageView />
    </ProtectedAuthRoute>
  );
}
