'use client';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { AgentsPageView } from './AgentsPageView';
import { AgentsSkeleton } from './_components/AgentsSkeleton';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent('/agents')}`;

export default function AgentsPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE} loadingFallback={<AgentsSkeleton />}>
      <AgentsPageView />
    </ProtectedAuthRoute>
  );
}
