import { gql } from '@apollo/client';

export const GET_AGENTS_BY_SPECIALIZATION_QUERY = gql`
  query AgentsBySpecialization(
    $specializationId: String!
    $page: Int
    $size: Int
    $search: String
  ) {
    agentsBySpecialization(
      specializationId: $specializationId
      page: $page
      size: $size
      search: $search
    ) {
      items {
        id
        name
        description
        status
      }
      total
      page
      size
    }
  }
`;
