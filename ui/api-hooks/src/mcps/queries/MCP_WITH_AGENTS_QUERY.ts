import { gql } from '@apollo/client';

export const MCP_WITH_AGENTS_QUERY = gql`
  query McpWithAgents($mcpId: String!, $page: Int, $size: Int) {
    mcpWithAgents(mcpId: $mcpId, page: $page, size: $size) {
      agentUsageCount
      configurationStatus
      totalCount
      page
      size
      mcp {
        id
        name
        slug
        iconPath
      }
      agents {
        id
        name
        category
        status
        assignedMcpIds
      }
    }
  }
`;
