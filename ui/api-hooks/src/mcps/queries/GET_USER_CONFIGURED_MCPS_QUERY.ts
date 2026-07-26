import { gql } from '@apollo/client';

export const GET_USER_CONFIGURED_MCPS_QUERY = gql`
  query GetUserConfiguredMcps($page: Int, $size: Int) {
    userConfiguredMcps(page: $page, size: $size) {
      items {
        id
        name
        description
        tags
        iconPath
        slug
        documentationUrl
        repositoryUrl
        configurationStatus
        enabled
        requiresConfiguration
        createdAt
        updatedAt
      }
      total
      page
      size
    }
  }
`;
