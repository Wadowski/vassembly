import { gql } from '@apollo/client';

export const AVAILABLE_TAGS_QUERY = gql`
  query AvailableTags {
    availableTags {
      tags
    }
  }
`;
