export const LIST_AI_INTEGRATIONS_QUERY = `
  query ListAiIntegrations($page: Int, $size: Int, $search: String, $status: String, $provider: String) {
    aiIntegrations(page: $page, size: $size, search: $search, status: $status, provider: $provider) {
      items {
        id
        userId
        name
        provider
        hasApiKey
        apiKeyHint
        baseUrl
        organizationId
        status
        connectionStatus
        lastTestedAt
        lastConnectionError
        agentUsageCount
        createdAt
        updatedAt
        removedAt
      }
      totalCount
      page
      size
    }
  }
`;
