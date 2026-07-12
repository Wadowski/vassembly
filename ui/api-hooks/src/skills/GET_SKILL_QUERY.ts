import { gql } from '@apollo/client';

export const GET_SKILL_QUERY = gql`
  query Skill($id: String!) {
    skill(id: $id) {
      id
      specializationId
      name
      description
      rule
      enabled
      scripts {
        filename
        language
      }
      usesSkillIds
      createdAt
      updatedAt
    }
  }
`;
