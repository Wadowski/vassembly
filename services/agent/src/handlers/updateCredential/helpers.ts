import { decode } from '@vassembly/client-encoder';

interface ShouldRetestConnectionParams {
  existing: {
    baseUrl?: string | null;
    organizationId?: string | null;
  };
  body: {
    apiKey?: string;
    baseUrl?: string | null;
    organizationId?: string | null;
  };
}

export const shouldRetestConnection = (params: ShouldRetestConnectionParams): boolean => {
  const { existing, body } = params;

  if (body.apiKey !== undefined) {
    return true;
  }
  if (body.baseUrl !== undefined && body.baseUrl !== existing.baseUrl) {
    return true;
  }
  if (body.organizationId !== undefined && body.organizationId !== existing.organizationId) {
    return true;
  }
  return false;
};

interface ResolveApiKeyForTestParams {
  bodyApiKey?: string;
  existingEncryptedApiKey?: string;
}

export const resolveApiKeyForTest = (params: ResolveApiKeyForTestParams): string | undefined => {
  if (params.bodyApiKey !== undefined) {
    return params.bodyApiKey.trim() ? params.bodyApiKey : undefined;
  }
  if (params.existingEncryptedApiKey) {
    return decode(params.existingEncryptedApiKey);
  }
  return undefined;
};
