export type CredentialMapping =
  | { kind: 'header'; headers: Array<{ headerName: string; fieldKey: string; format?: 'bearer' }> }
  | { kind: 'none' };

export const CREDENTIAL_MAPPINGS: Record<string, CredentialMapping> = {
  'brave-search-mcp': {
    kind: 'header',
    headers: [{ headerName: 'x-api-key', fieldKey: 'apiKey' }],
  },
  'wikipedia-mcp': { kind: 'none' },
};
