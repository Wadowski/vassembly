import { describe, expect, it, vi } from 'vitest';

import { archiveSkill } from './archiveSkill';

import type { HttpClient } from '../../http/types';

describe('archiveSkill', () => {
  it('should delete skill by id with auth', async () => {
    const client: HttpClient = {
      delete: vi.fn().mockResolvedValue({ id: 'skill-1', removedAt: '2026-04-01T00:00:00.000Z' }),
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    };

    const result = await archiveSkill({ client, skillId: 'skill-1' });

    expect(client.delete).toHaveBeenCalledWith({
      path: '/skills/skill-1',
      withAuth: true,
    });
    expect(result.removedAt).toBe('2026-04-01T00:00:00.000Z');
  });

  it('should throw when skill id is empty', async () => {
    const client: HttpClient = {
      delete: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    };

    await expect(archiveSkill({ client, skillId: '' })).rejects.toThrow('Skill id is required');
  });
});
