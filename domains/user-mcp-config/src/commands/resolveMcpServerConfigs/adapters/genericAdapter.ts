import type { McpRuntimeAdapter } from './types';
import type { CredentialMapping } from './credentialMappings';

const BEARER_HEADERS = new Set(['authorization']);

const readRequiredString = (
  fieldValues: Record<string, string | boolean>,
  fieldKey: string,
): string | null => {
  const value = fieldValues[fieldKey];
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value;
};

export const createGenericAdapter = (mapping: CredentialMapping): McpRuntimeAdapter => ({
  toServerConfig: ({ mcpId, fieldValues, serverUrl }) => {
    if (!serverUrl) {
      return null;
    }

    if (mapping.kind === 'none') {
      return {
        serverName: mcpId,
        transport: 'http',
        url: serverUrl,
      };
    }

    const headers: Record<string, string> = {};
    for (const { headerName, fieldKey, format, optional } of mapping.headers) {
      const value = readRequiredString(fieldValues, fieldKey);
      if (!value) {
        if (optional) {
          continue;
        }

        return null;
      }

      headers[headerName] =
        format === 'bearer' || BEARER_HEADERS.has(headerName.toLowerCase())
          ? `Bearer ${value}`
          : value;
    }

    return {
      serverName: mcpId,
      transport: 'http',
      url: serverUrl,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    };
  },
});
