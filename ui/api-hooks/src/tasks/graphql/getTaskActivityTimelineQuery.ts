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
        specializationIds
        commentSkillIds
        agentResponse
        planTemplateShortName
        planTemplateDescription
        planInstanceStatus
        planItems {
          templateItemIndex
          agentId
          agentName
          skillId
          skillName
          order
          status
          startedAt
          completedAt
          failedAt
          errorMessage
          retryCount
          description
        }
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
        internalToolId
        internalToolDisplayName
        toolDisplayName
        toolName
        status
        startedAt
        endedAt
        durationMs
        input
        inputTruncated
        output
        outputTruncated
        invocationId
        rootInvokeId
        errorMessage
        errorDetails {
          message
          type
          stackTrace
        }
        outcomeSummary
      }
    }
  }
`;
