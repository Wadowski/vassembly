import { MCP_SLUG } from '@vassembly/constants';

export type CredentialMapping =
  | { kind: 'header'; headers: Array<{ headerName: string; fieldKey: string; format?: 'bearer' }> }
  | { kind: 'none' };

export const CREDENTIAL_MAPPINGS: Record<string, CredentialMapping> = {
  [MCP_SLUG.BraveSearchMcp]: {
    kind: 'header',
    headers: [{ headerName: 'x-api-key', fieldKey: 'apiKey' }],
  },
  [MCP_SLUG.WikipediaMcp]: { kind: 'none' },
};
