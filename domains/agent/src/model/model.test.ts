import { describe, it, expect } from 'vitest';

import { agentFactory } from './factories';
import { AgentCategory, AgentModel, AgentStatus } from './model';

describe('AgentModel', () => {
  it('should preserve core fields when assigned on the model instance', () => {
    const agent = new AgentModel();
    agent.name = 'Code Review Helper';
    agent.category = AgentCategory.Coding;
    agent.description = 'Reviews PRs';
    agent.rule = 'Be constructive';
    agent.userId = 'user-1';
    agent.status = AgentStatus.Active;

    expect(agent.name).toBe('Code Review Helper');
    expect(agent.category).toBe('coding');
    expect(agent.description).toBe('Reviews PRs');
    expect(agent.rule).toBe('Be constructive');
    expect(agent.userId).toBe('user-1');
    expect(agent.status).toBe('active');
  });

  it('should materialize active catalog rows with removedAt null via factory defaults', () => {
    const agent = agentFactory.create({
      id: 'agent-1',
      name: 'Helper',
      category: AgentCategory.Utility,
      description: 'Does things',
      rule: 'Follow instructions',
      userId: 'user-1',
      status: AgentStatus.Active,
      removedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(agent).toBeInstanceOf(AgentModel);
    expect(agent.removedAt).toBeNull();
    expect(agent.status).toBe('active');
  });

  it('should represent archived soft-deleted rows with archived status and removedAt timestamp', () => {
    const deletedAt = new Date('2026-02-01T00:00:00.000Z');
    const agent = agentFactory.create({
      id: 'agent-archived',
      name: 'Old Bot',
      category: AgentCategory.Personal,
      description: 'Retired',
      rule: 'Idle',
      userId: 'user-1',
      status: AgentStatus.Archived,
      removedAt: deletedAt,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: deletedAt,
    });

    expect(agent.status).toBe('archived');
    expect(agent.removedAt).toEqual(deletedAt);
  });

  it('should accept disabled alive rows without removal timestamp', () => {
    const agent = agentFactory.create({
      id: 'agent-disabled',
      name: 'Paused Bot',
      category: AgentCategory.Coding,
      description: 'Paused',
      rule: 'Wait',
      userId: 'user-1',
      status: AgentStatus.Disabled,
      removedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    });

    expect(agent.status).toBe('disabled');
    expect(agent.removedAt).toBeNull();
  });
});
