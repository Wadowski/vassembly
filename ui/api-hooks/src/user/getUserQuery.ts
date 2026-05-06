export const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      verifiedAt
    }
  }
`;
