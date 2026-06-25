import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { requireWorkspaceModule } from '@vassembly/e2e';

import { initDomainContext } from './initDomainContext';
import { seedSpecialization } from './seedSpecialization';
import type { InitDomainContextParams } from './initDomainContext';

export type SkillScriptLanguage = 'python' | 'nodejs' | 'bash';

export interface SeedSkillScriptParams {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export interface SeedSkillParams extends InitDomainContextParams {
  specializationId: string;
  name: string;
  description: string;
  rule: string;
  scripts?: SeedSkillScriptParams[];
}

export interface SeedSkillsForSpecializationParams extends InitDomainContextParams {
  specializationName: string;
  skills: Array<{
    name: string;
    description: string;
    rule?: string;
    scripts?: SeedSkillScriptParams[];
  }>;
}

const DEFAULT_SKILL_RULE = 'Follow the workflow instructions for this skill.';
const DEFAULT_SCRIPT_STORAGE_ROOT = path.resolve(process.cwd(), '../../.data/skill-scripts');

const normalizeSkillKey = (name: string): string => name.trim().toLowerCase();

const ensureSkillIndexes = async ({ context }: InitDomainContextParams): Promise<void> => {
  initDomainContext({ context });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const skillDomain = requireWorkspaceModule<typeof import('@vassembly/domain-skill')>({
    moduleName: '@vassembly/domain-skill',
  });

  await init({ indexFunctions: [skillDomain.mongodbIndexes] });
};

const writeScriptFile = async ({
  storageKey,
  content,
}: {
  storageKey: string;
  content: string;
}): Promise<void> => {
  const fullPath = path.join(DEFAULT_SCRIPT_STORAGE_ROOT, storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
};

export const seedSkill = async ({
  context,
  specializationId,
  name,
  description,
  rule,
  scripts = [],
}: SeedSkillParams): Promise<string> => {
  await ensureSkillIndexes({ context });

  const { skillMongodbDao, skillFactory } = requireWorkspaceModule<
    typeof import('@vassembly/domain-skill')
  >({
    moduleName: '@vassembly/domain-skill',
  });

  const existing = await skillMongodbDao.collection.findOne({
    specializationId,
    name,
  });

  if (existing !== null && existing._id !== undefined) {
    return existing._id.toString();
  }

  const skillId = await skillMongodbDao.create(
    skillFactory.create({
      specializationId,
      name,
      description,
      rule,
      scripts: [],
    }),
  );

  const skillScripts = [];

  for (const script of scripts) {
    const storageKey = `skills/${skillId}/${script.filename}`;

    await writeScriptFile({ storageKey, content: script.content });

    skillScripts.push({
      filename: script.filename,
      language: script.language,
      storageKey,
    });
  }

  if (skillScripts.length > 0) {
    await skillMongodbDao.update(
      skillFactory.create({ id: skillId }),
      skillFactory.create({ scripts: skillScripts }),
    );
  }

  return skillId;
};

export const seedSkillsForSpecialization = async ({
  context,
  specializationName,
  skills,
}: SeedSkillsForSpecializationParams): Promise<{
  specializationId: string;
  skillIds: Record<string, string>;
}> => {
  const specializationId = await seedSpecialization({
    context,
    name: specializationName,
    description: `E2E specialization for skills: ${specializationName}.`,
  });

  const skillIds: Record<string, string> = {};

  for (const skill of skills) {
    const skillId = await seedSkill({
      context,
      specializationId,
      name: skill.name,
      description: skill.description,
      rule: skill.rule ?? DEFAULT_SKILL_RULE,
      scripts: skill.scripts,
    });

    skillIds[normalizeSkillKey(skill.name)] = skillId;
  }

  return { specializationId, skillIds };
};

export { normalizeSkillKey };
