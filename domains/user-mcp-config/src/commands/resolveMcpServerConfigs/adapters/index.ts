import { CREDENTIAL_MAPPINGS } from './credentialMappings';
import { createGenericAdapter } from './genericAdapter';

import type { McpRuntimeAdapter } from './types';

const defaultAdapter: McpRuntimeAdapter = { toServerConfig: () => null };

const ADAPTERS: Record<string, McpRuntimeAdapter> = Object.fromEntries(
  Object.entries(CREDENTIAL_MAPPINGS).map(([slug, mapping]) => [
    slug,
    createGenericAdapter(mapping),
  ]),
);

export interface GetMcpRuntimeAdapterParams {
  slug: string;
}

export const getMcpRuntimeAdapter = ({ slug }: GetMcpRuntimeAdapterParams): McpRuntimeAdapter =>
  ADAPTERS[slug] ?? defaultAdapter;
