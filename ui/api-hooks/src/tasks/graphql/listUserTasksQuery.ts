export const LIST_USER_TASKS_QUERY = `
  query ListUserTasks($page: Int, $size: Int, $search: String) {
    userTasks(page: $page, size: $size, search: $search) {
      items {
        id
        userId
        description
        type
        status
        agentAssignedId
        title
        createdAt
        updatedAt
      }
      totalCount
      page
      size
    }
  }
`;
