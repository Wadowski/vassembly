import { gql } from '@apollo/client';

export const TASK_PROGRESS_BY_COMMENT_QUERY = gql`
  query TaskProgressByComment($taskId: ID!, $commentId: ID!) {
    taskProgressByComment(taskId: $taskId, commentId: $commentId) {
      id
      taskId
      commentId
      startedAt
      completedAt
      totalDuration
      totalTokens {
        input
        output
        total
      }
      executionAttempt
      events {
        id
        agentId
        agentName
        parentAgentId
        state
        timestamp
        duration
        inputMessages
        generatedResponse
        tokenUsage {
          input
          output
          total
        }
        errorDetails {
          message
          type
          stackTrace
        }
        integrationName
        provider
        model
      }
    }
  }
`;
