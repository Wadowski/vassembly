import { AI_INTEGRATION_PROVIDER_LABELS } from '@vassembly/constants';

export interface GetProviderLabelParams {
  provider: string | null;
}

export const getProviderLabel = ({ provider }: GetProviderLabelParams): string => {
  if (!provider) {
    return '';
  }

  return AI_INTEGRATION_PROVIDER_LABELS[provider] ?? provider;
};
