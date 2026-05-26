export const LIST_SYSTEM_AGENTS_QUERY = `
  query ListSystemAgents($page: Int, $size: Int, $search: String, $status: String) {
    systemAgents(page: $page, size: $size, search: $search, status: $status) {
      items {
        id
        name
        description
        category
        status
        rule
        createdByAdminId
        updatedByAdminId
        createdAt
        updatedAt
        removedAt
      }
      page
      size
      total
    }
  }
`;
