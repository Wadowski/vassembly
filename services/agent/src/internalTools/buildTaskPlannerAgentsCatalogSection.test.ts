import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockListSystemAgentsBySpecializationIds } = vi.hoisted(() => ({
  mockListSystemAgentsBySpecializationIds: vi.fn(),
}));

vi.mock('./listAgents/listSystemAgentsBySpecializationIds', () => ({
  listSystemAgentsBySpecializationIds: mockListSystemAgentsBySpecializationIds,
}));

import { buildTaskPlannerAgentsCatalogSection } from './buildTaskPlannerAgentsCatalogSection';

const SPECIALIZATION_ID = '507f1f77bcf86cd799439012';

describe('buildTaskPlannerAgentsCatalogSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list plan-assignable agent roles and exclude methodologists', async () => {
    mockListSystemAgentsBySpecializationIds.mockResolvedValue([
      { id: 'methodologist-id', name: 'Legal methodologist' },
      { id: 'researcher-id', name: 'Legal researcher' },
      { id: 'worker-id', name: 'Legal worker' },
      { id: 'validator-id', name: 'Legal validator' },
    ]);

    const section = await buildTaskPlannerAgentsCatalogSection({
      specializationIds: [SPECIALIZATION_ID],
    });

    expect(section).not.toContain('methodologist');
    expect(section).toContain('**Legal researcher** (researcher)');
    expect(section).toContain('**Legal worker** (worker)');
    expect(section).toContain('**Legal validator** (validator)');
    expect(section).toContain('worker, researcher, or validator');
    expect(section).toContain('Methodologists run before planning');
  });

  it('should return none message when no specialization agents exist', async () => {
    mockListSystemAgentsBySpecializationIds.mockResolvedValue([
      { id: 'task-worker-id', name: 'Task worker' },
    ]);

    const section = await buildTaskPlannerAgentsCatalogSection({
      specializationIds: [SPECIALIZATION_ID],
    });

    expect(section).toContain('(none — no specialization agents for this task)');
  });
});
