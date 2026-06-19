export const GET_TASK_QUERY = `
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      userId
      description
      type
      status
      agentAssignedId
      title
      llmResponse
      errorMessage
      errorCode
      startedAt
      completedAt
      failedAt
      pausedAt
      createdAt
      updatedAt
    }
  }
`;
