import { gql } from '@apollo/client';

export const TASK_PROGRESS_QUERY = gql`
  query TaskProgress($taskId: ID!) {
    taskProgress(taskId: $taskId) {
      id
      taskId
      startedAt
      completedAt
      totalDuration
      totalTokens {
        input
        output
        total
      }
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
