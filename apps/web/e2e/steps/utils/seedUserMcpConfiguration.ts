import { getE2eEnvironment } from '@vassembly/e2e';

import { getMcpIdBySlug } from './seedMcp';
import type { InitDomainContextParams } from './initDomainContext';

export interface SeedUserMcpConfigurationParams extends InitDomainContextParams {
  slug: string;
  token: string;
}

const MCP_FIELD_VALUES_BY_SLUG: Record<string, Record<string, string | boolean>> = {
  'brave-search-mcp': {
    apiKey: 'e2e-test-api-key',
  },
  'wikipedia-mcp': {},
};

export const seedUserMcpConfiguration = async ({
  context,
  slug,
  token,
}: SeedUserMcpConfigurationParams): Promise<string> => {
  const fieldValues = MCP_FIELD_VALUES_BY_SLUG[slug];
  if (fieldValues === undefined) {
    throw new Error(`No E2E MCP field values configured for slug "${slug}"`);
  }

  const mcpId = await getMcpIdBySlug({ context, slug });
  const apiBaseUrl = getE2eEnvironment().apiBaseUrl;
  const configurationUrl = `${apiBaseUrl}/mcps/${mcpId}/configuration`;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  await fetch(configurationUrl, { method: 'DELETE', headers: authHeaders });

  const response = await fetch(configurationUrl, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fieldValues }),
  });

  if (response.status === 201 || response.status === 409) {
    return mcpId;
  }

  const body = await response.text();
  throw new Error(`Failed to seed MCP configuration for ${slug} (${response.status}): ${body}`);
};
