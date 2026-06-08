import { gql } from '@apollo/client';

export const LIST_MCPS_QUERY = gql`
  query ListMcps(
    $page: Int
    $size: Int
    $search: String
    $tags: [String!]
  ) {
    mcps(page: $page, size: $size, search: $search, tags: $tags) {
      items {
        id
        name
        description
        tags
        iconPath
        slug
        documentationUrl
        repositoryUrl
        createdAt
        updatedAt
      }
      total
      page
      size
    }
  }
`;
