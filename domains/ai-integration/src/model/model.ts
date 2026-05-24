import { Model } from '@vassembly/model';

import type {
  AiIntegrationConnectionStatusValue,
  AiIntegrationProviderValue,
  AiIntegrationStatusValue,
} from '../types';

export class AiIntegrationCredentialModel extends Model {
  userId?: string;

  name?: string;

  provider?: AiIntegrationProviderValue;

  encryptedApiKey?: string;

  baseUrl?: string;

  organizationId?: string;

  status?: AiIntegrationStatusValue;

  connectionStatus?: AiIntegrationConnectionStatusValue;

  lastTestedAt?: Date;

  lastConnectionError?: string;
}
