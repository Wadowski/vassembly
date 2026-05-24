'use client';

import { ProtectedAuthRoute } from '../../../../lib/auth/ProtectedAuthRoute';
import { AI_INTEGRATIONS_CREATE_PATH } from '../../../../lib/routes/aiIntegrations';
import { AiIntegrationCreatePageContent } from '../../_components/ai-integrations/useAiIntegrationCreatePage';

const LOGIN_ROUTE = `/login?returnUrl=${encodeURIComponent(AI_INTEGRATIONS_CREATE_PATH)}`;

export default function AiIntegrationCreatePage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath={LOGIN_ROUTE}>
      <AiIntegrationCreatePageContent />
    </ProtectedAuthRoute>
  );
}
