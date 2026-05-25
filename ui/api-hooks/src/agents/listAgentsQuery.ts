export const LIST_AGENTS_QUERY = `
  query ListAgents($page: Int, $size: Int, $search: String, $status: String) {
    agents(page: $page, size: $size, search: $search, status: $status) {
      items {
        id
        name
        category
        description
        rule
        userId
        status
        integrationCredentialId
        createdAt
        updatedAt
        removedAt
      }
      totalCount
      page
      size
    }
  }
`;
