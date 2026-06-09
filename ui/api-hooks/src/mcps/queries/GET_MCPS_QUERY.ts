import { gql } from '@apollo/client';

export const GET_MCPS_QUERY = gql`
  query GetMcps {
    mcps {
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
        createdAt
        updatedAt
      }
      total
      page
      size
    }
  }
`;
