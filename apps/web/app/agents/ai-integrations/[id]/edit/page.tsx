'use client';

import { ProtectedAuthRoute } from '../../../../../lib/auth/ProtectedAuthRoute';
import { AI_INTEGRATIONS_LIST_ANCHOR } from '../../../../../lib/routes/aiIntegrations';
import { AiIntegrationEditPageContent } from './useAiIntegrationEditPage';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent(AI_INTEGRATIONS_LIST_ANCHOR)}`;

export default function AiIntegrationEditPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE}>
      <AiIntegrationEditPageContent />
    </ProtectedAuthRoute>
  );
}
