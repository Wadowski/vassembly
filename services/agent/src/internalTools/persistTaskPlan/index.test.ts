import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFindEquivalent,
  mockCreateTemplate,
  mockCreateInstance,
  mockGetSkillById,
  mockGetBySpecializationId,
  mockSetAgentResponse,
} = vi.hoisted(() => ({
  mockFindEquivalent: vi.fn(),
  mockCreateTemplate: vi.fn(),
  mockCreateInstance: vi.fn(),
  mockGetSkillById: vi.fn(),
  mockGetBySpecializationId: vi.fn(),
  mockSetAgentResponse: vi.fn(),
}));

vi.mock('@vassembly/domain-task-plan-template', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-task-plan-template')>();

  return {
    ...actual,
    default: {
      queries: { findEquivalent: mockFindEquivalent },
      commands: { create: mockCreateTemplate },
    },
  };
});

vi.mock('@vassembly/domain-task-plan-instance', () => ({
  default: {
    commands: { create: mockCreateInstance },
  },
}));

vi.mock('@vassembly/domain-skill', () => ({
  default: {
    queries: { getById: mockGetSkillById },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getBySpecializationId: mockGetBySpecializationId },
  },
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    commands: { setAgentResponse: mockSetAgentResponse },
  },
}));

import { persistTaskPlanToolHandler } from './index';

import type { InternalToolContext } from '../types';

const VALID_AGENT_ID = '507f1f77bcf86cd799439011';
const VALID_SKILL_ID = '507f1f77bcf86cd799439012';
const TEMPLATE_ID = '507f1f77bcf86cd799439013';
const INSTANCE_ID = '507f1f77bcf86cd799439014';
const SPECIALIZATION_ID = '507f1f77bcf86cd799439015';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
  specializationIds: [SPECIALIZATION_ID],
};

const VALID_WORKER_AGENT_ID = '507f1f77bcf86cd799439016';

const buildValidInput = () => ({
  shortName: 'contract-risk-review',
  description: 'Review contract documents for risky clauses.',
  inputDetails: { documentReference: { type: 'file' } },
  outputDetails: { summary: { type: 'text' } },
  resolvedInputDetails: { documentReference: 'nda.pdf' },
  items: [
    {
      agentName: 'Legal worker',
      skillId: VALID_SKILL_ID,
      description: 'Extract clauses from the contract',
      order: 1,
    },
  ],
});

describe('persistTaskPlan internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSkillById.mockResolvedValue({ data: { id: VALID_SKILL_ID } });
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: VALID_AGENT_ID, name: 'Legal researcher' },
        { id: VALID_WORKER_AGENT_ID, name: 'Legal worker' },
      ],
    });
    mockFindEquivalent.mockResolvedValue({ data: null });
    mockCreateTemplate.mockResolvedValue({ data: { id: TEMPLATE_ID } });
    mockCreateInstance.mockResolvedValue({ data: { id: INSTANCE_ID } });
    mockSetAgentResponse.mockResolvedValue({ data: { id: 'comment-1' } });
  });

  it('should return template and instance ids when creating a new template', async () => {
    const result = await persistTaskPlanToolHandler(buildValidInput(), BASE_CONTEXT);

    expect(JSON.parse(result)).toEqual({
      taskPlanTemplateId: TEMPLATE_ID,
      taskPlanInstanceId: INSTANCE_ID,
      reusedExistingTemplate: false,
    });
    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            agentId: VALID_WORKER_AGENT_ID,
          }),
        ],
      }),
    );
    expect(mockSetAgentResponse).toHaveBeenCalledWith({
      commentId: 'comment-1',
      taskPlanInstanceId: INSTANCE_ID,
    });
  });

  it('should reuse existing template when findEquivalent matches', async () => {
    mockFindEquivalent.mockResolvedValue({
      data: { id: TEMPLATE_ID, shortName: 'contract-risk-review' },
    });

    const result = await persistTaskPlanToolHandler(buildValidInput(), BASE_CONTEXT);

    expect(JSON.parse(result)).toEqual({
      taskPlanTemplateId: TEMPLATE_ID,
      taskPlanInstanceId: INSTANCE_ID,
      reusedExistingTemplate: true,
    });
  });

  it('should return error JSON when agentName does not resolve', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: VALID_AGENT_ID, name: 'Legal researcher' },
        { id: VALID_WORKER_AGENT_ID, name: 'Legal worker' },
      ],
    });

    const result = await persistTaskPlanToolHandler(
      {
        ...buildValidInput(),
        items: [
          {
            agentName: 'researcher_1',
            skillId: null,
            description: 'Do research',
            order: 1,
          },
        ],
      },
      BASE_CONTEXT,
    );

    const parsed = JSON.parse(result) as { error?: string };

    expect(parsed.error).toContain('Unknown agentName');
  });

  it('should persist plans with worker, validator, and researcher items', async () => {
    const validatorAgentId = '507f1f77bcf86cd799439017';
    const researcherAgentId = VALID_AGENT_ID;

    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: researcherAgentId, name: 'Legal researcher' },
        { id: VALID_WORKER_AGENT_ID, name: 'Legal worker' },
        { id: validatorAgentId, name: 'Legal validator' },
      ],
    });

    const result = await persistTaskPlanToolHandler(
      {
        ...buildValidInput(),
        items: [
          {
            agentName: 'Legal worker',
            skillId: VALID_SKILL_ID,
            description: 'Execute work',
            order: 1,
          },
          {
            agentName: 'Legal validator',
            skillId: null,
            description: 'Verify that work was completed',
            order: 2,
          },
          {
            agentName: 'Legal researcher',
            skillId: null,
            description: 'What jurisdiction applies?',
            order: 3,
          },
        ],
      },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      taskPlanTemplateId: TEMPLATE_ID,
      taskPlanInstanceId: INSTANCE_ID,
      reusedExistingTemplate: false,
    });
    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ agentId: VALID_WORKER_AGENT_ID }),
          expect.objectContaining({ agentId: validatorAgentId }),
          expect.objectContaining({ agentId: researcherAgentId }),
        ],
      }),
    );
  });
});
