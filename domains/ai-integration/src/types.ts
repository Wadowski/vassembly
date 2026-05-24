import type {
  AiIntegrationConnectionStatus,
  AiIntegrationProvider,
  AiIntegrationStatus,
} from './constants';

export type AiIntegrationProviderValue =
  (typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider];

export type AiIntegrationStatusValue = (typeof AiIntegrationStatus)[keyof typeof AiIntegrationStatus];

export type AiIntegrationConnectionStatusValue =
  (typeof AiIntegrationConnectionStatus)[keyof typeof AiIntegrationConnectionStatus];
