import { gql } from '@apollo/client';

export const LIST_SKILLS_BY_SPECIALIZATION_QUERY = gql`
  query SkillsBySpecialization(
    $specializationId: String!
    $page: Int
    $size: Int
    $search: String
  ) {
    skillsBySpecialization(
      specializationId: $specializationId
      page: $page
      size: $size
      search: $search
    ) {
      items {
        id
        specializationId
        name
        description
        enabled
      }
      total
      page
      size
    }
  }
`;
