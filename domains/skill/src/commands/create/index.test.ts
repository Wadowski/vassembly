import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const {
  mockPersistCreate,
  mockGetModelById,
  mockGetRaw,
  mockPersistSkillScripts,
  mockSkillMongodbDaoUpdate,
} = vi.hoisted(() => ({
  mockPersistCreate: vi.fn(),
  mockGetModelById: vi.fn(),
  mockGetRaw: vi.fn(),
  mockPersistSkillScripts: vi.fn(),
  mockSkillMongodbDaoUpdate: vi.fn(),
}));

vi.mock('@vassembly/commands', () => ({
  createDb: () => mockPersistCreate,
}));

vi.mock('../../clients', () => ({
  skillMongodbDao: {
    getRaw: mockGetRaw,
    update: mockSkillMongodbDaoUpdate,
  },
  scriptStorageClient: {},
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

vi.mock('../shared/persistScripts', () => ({
  persistSkillScripts: mockPersistSkillScripts,
}));

vi.mock('../../model', async () => {
  const actual = await vi.importActual<typeof import('../../model')>('../../model');

  return {
    ...actual,
    skillFactory: {
      create: (data: Record<string, unknown>) => data,
    },
  };
});

import { create } from './index';

describe('create skill command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRaw.mockResolvedValue(null);
    mockPersistCreate.mockResolvedValue({
      data: {
        id: 'skill-new',
        scripts: [],
      },
    });
    mockPersistSkillScripts.mockResolvedValue([
      {
        filename: 'scripts/format-recipe-to-json.py',
        language: 'python',
        storageKey: 'skills/skill-existing/scripts/format-recipe-to-json.py',
      },
    ]);
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'skill-existing',
        scripts: [
          {
            filename: 'scripts/format-recipe-to-json.py',
            language: 'python',
            storageKey: 'skills/skill-existing/scripts/format-recipe-to-json.py',
          },
        ],
      },
    });
  });

  it('should backfill scripts when returning an existing skill without scripts', async () => {
    mockGetRaw.mockResolvedValue({
      id: 'skill-existing',
      specializationId: 'spec-1',
      name: 'format-recipe-to-json',
      scripts: [],
    });

    const result = await create({
      specializationId: 'spec-1',
      name: 'format-recipe-to-json',
      description: 'Formats recipes',
      input: 'Recipe text',
      output: 'JSON',
      rule: 'run_skill_script scripts/format-recipe-to-json.py',
      scripts: [
        {
          filename: 'scripts/format-recipe-to-json.py',
          language: 'python',
          content: 'print("ok")',
        },
      ],
      onDuplicate: 'returnExisting',
    });

    expect(mockPersistSkillScripts).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'skill-existing',
      }),
    );
    expect(mockSkillMongodbDaoUpdate).toHaveBeenCalled();
    expect(result.isNew).toBe(false);
    expect(result.data.scripts).toHaveLength(1);
  });

  it('should reject rules that reference run_skill_script without scripts', async () => {
    await expect(
      create({
        specializationId: 'spec-1',
        name: 'format-recipe-to-json',
        description: 'Formats recipes',
        input: 'Recipe text',
        output: 'JSON',
        rule: 'run_skill_script scripts/format-recipe-to-json.py',
        scripts: [],
        onDuplicate: 'error',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
