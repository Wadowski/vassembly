import { gql } from '@apollo/client';

export const GET_USER_CONFIGURED_MCPS_QUERY = gql`
  query GetUserConfiguredMcps {
    userConfiguredMcps {
      items {
        id
        mcpId
        status
        enabled
        lastTestedAt
        updatedAt
        createdAt
      }
    }
  }
`;
