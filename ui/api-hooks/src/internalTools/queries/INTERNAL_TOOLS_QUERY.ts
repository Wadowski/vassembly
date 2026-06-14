import { gql } from '@apollo/client';

export const INTERNAL_TOOLS_QUERY = gql`
  query InternalTools {
    internalTools {
      id
      displayName
      description
      accessScope
    }
  }
`;
