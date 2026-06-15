'use client';

import { ProtectedAuthRoute } from '../../../../../lib/auth/ProtectedAuthRoute';
import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../../aiIntegrationRoutes';
import { AiIntegrationEditPage } from './AiIntegrationEditPage';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent(AI_INTEGRATIONS_LIST_ANCHOR)}`;

export default function AiIntegrationEditPageRoute(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE}>
      <AiIntegrationEditPage />
    </ProtectedAuthRoute>
  );
}
