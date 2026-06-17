export const GET_TASK_QUESTIONS_QUERY = `
  query GetTaskQuestions($taskId: ID!) {
    taskQuestions(taskId: $taskId) {
      taskId
      pendingQuestions {
        questionId
        invocationId
        askedByAgentId
        askedByAgentType
        question
        inputType
        options
        askedAt
      }
      answeredQuestions {
        questionId
        invocationId
        askedByAgentId
        askedByAgentType
        question
        inputType
        options
        answer
        askedAt
        answeredAt
      }
    }
  }
`;
