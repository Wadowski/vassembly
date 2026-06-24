import { gql } from '@apollo/client';

export const LIST_SPECIALIZATIONS_QUERY = gql`
  query ListSpecializations($search: String, $page: Int, $size: Int) {
    specializations(search: $search, page: $page, size: $size) {
      items {
        id
        name
        description
        agentIds
        mcpIds
        createdAt
        updatedAt
      }
      page
      size
      total
    }
  }
`;
