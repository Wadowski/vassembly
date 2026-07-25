export const GET_TASK_ACTIVITY_TIMELINE_QUERY = `
  query GetTaskActivityTimeline($taskId: ID!) {
    taskActivityTimeline(taskId: $taskId) {
      items {
        kind
        id
        occurredAt
        sortKey
        filterGroup
        commentId
        userText
        agentResponse
        totalDuration
        totalTokens {
          input
          output
          total
        }
        questionId
        question
        answer
        eventId
        agentId
        agentName
        state
        timestamp
        duration
        tokenUsage {
          input
          output
          total
        }
        inputMessages
        generatedResponse
        integrationName
        provider
        model
        usageEventId
        mcpId
        mcpName
        toolName
        status
        durationMs
        errorMessage
      }
    }
  }
`;
