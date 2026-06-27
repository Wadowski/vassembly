import { gql } from '@apollo/client';

export const GET_SPECIALIZATION_QUERY = gql`
  query GetSpecialization($id: String!) {
    specialization(id: $id) {
      id
      name
      description
      agentIds
      mcpIds
      createdAt
      updatedAt
    }
  }
`;
