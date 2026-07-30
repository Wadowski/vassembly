import type { AiIntegrationCredentialDto } from '@vassembly/ui-api-hooks';

export interface IsCredentialEligibleForSystemAgentPreferenceParams {
  credential: AiIntegrationCredentialDto;
}

export const isCredentialEligibleForSystemAgentPreference = ({
  credential,
}: IsCredentialEligibleForSystemAgentPreferenceParams): boolean =>
  credential.status === 'active' && credential.connectionStatus === 'connected';

export interface UseSetSystemAgentPreferenceParams {
  onSuccess?: () => Promise<void> | void;
}

export interface SystemAgentPreferenceBadgeProps {
  credentialId: string;
  currentCredentialId?: string;
}

export interface SystemAgentPreferenceActionProps {
  credential: AiIntegrationCredentialDto;
  currentCredentialId?: string;
  isPreferenceLoading: boolean;
  savingCredentialId: string | null;
  isSaving: boolean;
  onSetPreference: (credentialId: string) => Promise<void>;
}
