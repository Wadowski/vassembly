import { gql } from '@apollo/client';

export const GET_MCP_CONFIGURATION_QUERY = gql`
  query GetMcpConfiguration($mcpId: String!) {
    mcpConfiguration(mcpId: $mcpId) {
      id
      mcpId
      status
      lastTestedAt
      fieldValues {
        key
        value
        hasSecret
      }
      createdAt
      updatedAt
    }
  }
`;
