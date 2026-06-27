import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';
import { WrongParamError } from '@vassembly/errors';

import { initDomainContext } from './initDomainContext';
import { ensureSkillIndexes, normalizeSkillKey } from './seedSkill';

export interface SetSkillEnabledParams {
  context: SeedContext;
  skillId: string;
  enabled: boolean;
}

export interface ArchiveSkillForE2eParams {
  context: SeedContext;
  skillId: string;
}

export const setSkillEnabledState = async ({
  context,
  skillId,
  enabled,
}: SetSkillEnabledParams): Promise<void> => {
  await ensureSkillIndexes({ context });

  const skillDomain = requireWorkspaceModule<typeof import('@vassembly/domain-skill')>({
    moduleName: '@vassembly/domain-skill',
  });

  await skillDomain.default.commands.update({
    id: skillId,
    enabled,
  });
};

export const archiveSkillForE2e = async ({
  context,
  skillId,
}: ArchiveSkillForE2eParams): Promise<void> => {
  await ensureSkillIndexes({ context });

  const skillDomain = requireWorkspaceModule<typeof import('@vassembly/domain-skill')>({
    moduleName: '@vassembly/domain-skill',
  });

  try {
    await skillDomain.default.commands.removeSoft({ id: skillId });
  } catch (error) {
    if (error instanceof WrongParamError) {
      return;
    }

    throw error;
  }
};

export const queryActiveSkillsBySpecialization = async ({
  context,
  specializationId,
}: {
  context: SeedContext;
  specializationId: string;
}): Promise<Array<{ name?: string }>> => {
  initDomainContext({ context });
  await ensureSkillIndexes({ context });

  const skillDomain = requireWorkspaceModule<typeof import('@vassembly/domain-skill')>({
    moduleName: '@vassembly/domain-skill',
  });

  const result = await skillDomain.default.queries.getBySpecializationId({ specializationId });
  return result.items;
};

export const rememberSkillNameKey = normalizeSkillKey;
