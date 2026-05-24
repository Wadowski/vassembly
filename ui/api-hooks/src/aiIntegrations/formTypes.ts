import type {
  AiIntegrationCredentialDto,
  AiIntegrationFormInput,
  AiIntegrationUpdateInput,
} from './types';

export interface AiIntegrationCreateVariables {
  body: AiIntegrationFormInput;
}

export interface AiIntegrationUpdateVariables {
  id: string;
  body: AiIntegrationUpdateInput;
}

export interface AiIntegrationDeleteVariables {
  id: string;
}

export interface AiIntegrationRestoreVariables {
  id: string;
}

export interface AiIntegrationCreateMutationData {
  credential: AiIntegrationCredentialDto;
}

export interface AiIntegrationUpdateMutationData {
  credential: AiIntegrationCredentialDto;
}

export interface AiIntegrationDeleteMutationData {
  success: boolean;
  message: string;
}

export interface AiIntegrationRestoreMutationData {
  credential: AiIntegrationCredentialDto;
}

import type { AiIntegrationProvider } from './types';

export interface TestConnectionBody {
  credentialId?: string;
  provider?: AiIntegrationProvider;
  apiKey?: string;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export interface TestConnectionVariables {
  body: TestConnectionBody;
}
