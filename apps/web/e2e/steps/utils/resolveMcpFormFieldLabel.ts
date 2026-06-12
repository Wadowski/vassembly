const MCP_FORM_FIELD_LABELS: Record<string, string> = {
  apiKey: 'API Key',
  clientId: 'Client ID',
  clientSecret: 'Client Secret',
  scopes: 'Access Level',
  acceptTerms: 'I accept the provider terms',
};

export const resolveMcpFormFieldLabel = (fieldKey: string): string =>
  MCP_FORM_FIELD_LABELS[fieldKey] ?? fieldKey;
