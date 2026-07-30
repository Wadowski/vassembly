export const GET_MCP_USAGE_HISTORY_QUERY = `
  query GetMcpUsageHistory($mcpId: ID!, $page: Int, $size: Int) {
    mcpUsageHistory(mcpId: $mcpId, page: $page, size: $size) {
      items {
        id
        mcpId
        mcpSlug
        toolName
        toolDisplayName
        userId
        taskId
        commentId
        agentId
        agentName
        taskTitle
        status
        startedAt
        endedAt
        durationMs
        input
        inputTruncated
        output
        outputTruncated
        errorMessage
        createdAt
        updatedAt
      }
      total
      page
      size
    }
  }
`;
