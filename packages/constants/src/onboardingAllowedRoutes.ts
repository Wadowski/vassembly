export const ONBOARDING_ALLOWED_ROUTES = [
  '/onboarding',
  '/settings',
  '/agents/ai-integrations/create',
  '/verify-email',
  '/mcps',
] as const;

export const ONBOARDING_GRAPHQL_ALLOWED_QUERIES = new Set([
  'user',
  'aiIntegrations',
  'mcps',
  'availableTags',
  'userConfiguredMcps',
  'mcp',
  'mcpConfiguration',
  'mcpWithAgents',
]);
