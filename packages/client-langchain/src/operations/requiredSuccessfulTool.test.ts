import { describe, expect, it } from 'vitest';

import {
  buildRequiredToolNudgeMessage,
  hasRequiredToolSucceeded,
  isSuccessfulRequiredToolResult,
} from './requiredSuccessfulTool';

describe('requiredSuccessfulTool', () => {
  it('should treat persist_task_plan as successful only when taskPlanInstanceId is returned', () => {
    expect(
      isSuccessfulRequiredToolResult({
        toolName: 'persist_task_plan',
        content: '{"taskPlanInstanceId":"instance-1"}',
      }),
    ).toBe(true);

    expect(
      isSuccessfulRequiredToolResult({
        toolName: 'persist_task_plan',
        content: '{"error":"Unknown agentName"}',
      }),
    ).toBe(false);
  });

  it('should detect when required tool has not succeeded', () => {
    expect(
      hasRequiredToolSucceeded({
        requiredSuccessfulToolName: 'persist_task_plan',
        executedToolResults: [],
      }),
    ).toBe(false);

    expect(
      hasRequiredToolSucceeded({
        requiredSuccessfulToolName: 'persist_task_plan',
        executedToolResults: [
          {
            toolName: 'persist_task_plan',
            content: '{"error":"Unknown agentName"}',
          },
        ],
      }),
    ).toBe(false);
  });

  it('should build nudge message with last persist error', () => {
    const message = buildRequiredToolNudgeMessage({
      requiredSuccessfulToolName: 'persist_task_plan',
      executedToolResults: [
        {
          toolName: 'persist_task_plan',
          content: '{"error":"specializationIds are required in execution context"}',
        },
      ],
    });

    expect(message).toContain('specializationIds are required');
    expect(message).toContain('persist_task_plan');
  });

  it('should include missingFields in nudge message from structured payload', () => {
    const message = buildRequiredToolNudgeMessage({
      requiredSuccessfulToolName: 'use_agent',
      executedToolResults: [
        {
          toolName: 'use_agent',
          content: JSON.stringify({
            error: 'use_agent is missing required fields: agentPrompt',
            code: 'MISSING_REQUIRED_FIELDS',
            missingFields: ['agentPrompt'],
            hint: 'Call use_agent again including: agentPrompt.',
          }),
        },
      ],
    });

    expect(message).toContain('agentPrompt');
    expect(message).toContain('use_agent');
  });
});
