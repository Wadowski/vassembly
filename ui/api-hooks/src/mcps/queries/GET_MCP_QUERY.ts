import { gql } from '@apollo/client';

export const GET_MCP_QUERY = gql`
  query GetMcp($id: String!) {
    mcp(id: $id) {
      id
      name
      description
      tags
      iconPath
      slug
      documentationUrl
      repositoryUrl
      configurationStatus
      agentUsageCount
      configSchema {
        fields {
          key
          label
          type
          description
          required
          defaultValue
          placeholder
          format
          pattern
          minLength
          maxLength
          options {
            value
            label
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;
