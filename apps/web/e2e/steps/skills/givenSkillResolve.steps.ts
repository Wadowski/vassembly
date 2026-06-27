import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { seedSpecialization } from '../utils/seedSpecialization';
import { archiveSkillForE2e, setSkillEnabledState } from '../utils/skillStateHelpers';
import {
  assignInternalToolsToSystemAgent,
  seedRuntimeSystemAgent,
} from '../utils/skillRuntimeHelpers';
import { normalizeSkillKey, seedSkill } from '../utils/seedSkill';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const LEGAL_DESCRIPTION = 'Covers legal research, contract drafting, and regulatory compliance.';
const CONTRACT_REVIEW_RULE = [
  'Review each contract clause for compliance risks.',
  'Flag ambiguous language before approval.',
  'Summarize findings for the legal team.',
].join('\n');
const CONTRACT_REVIEW_DESCRIPTION = 'Validate contract clauses against policy requirements.';
const LEGAL_RESEARCH_DESCRIPTION = 'Research case law and summarize findings for attorneys.';
const OLD_RESEARCH_DESCRIPTION = 'Legacy research workflow retained for audit history.';

const rememberSpecializationId = ({
  world,
  name,
  specializationId,
}: {
  world: WebBddWorld;
  name: string;
  specializationId: string;
}): void => {
  const key = name.trim().toLowerCase();
  world.specializationId = specializationId;
  world.specializationIds = {
    ...(world.specializationIds ?? {}),
    [key]: specializationId,
  };
};

const rememberSkillId = ({
  world,
  name,
  skillId,
}: {
  world: WebBddWorld;
  name: string;
  skillId: string;
}): void => {
  const key = normalizeSkillKey(name);
  world.skillId = skillId;
  world.skillIds = {
    ...(world.skillIds ?? {}),
    [key]: skillId,
  };
};

Given(
  'specialization {string} has disabled skill {string}',
  async ({ seed, world }, specializationName: string, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationKey = specializationName.trim().toLowerCase();
    let specializationId =
      webWorld.specializationIds?.[specializationKey] ?? webWorld.specializationId;

    if (!specializationId) {
      specializationId = await seedSpecialization({
        context: seed,
        name: specializationName,
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });
    }

    const skillId = await seedSkill({
      context: seed,
      specializationId,
      name: skillName,
      description: LEGAL_RESEARCH_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
    });
    rememberSkillId({ world: webWorld, name: skillName, skillId });
    await setSkillEnabledState({ context: seed, skillId, enabled: false });
  },
);

Given(
  'specialization {string} has archived skill {string}',
  async ({ seed, world }, specializationName: string, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationKey = specializationName.trim().toLowerCase();
    let specializationId =
      webWorld.specializationIds?.[specializationKey] ?? webWorld.specializationId;

    if (!specializationId) {
      specializationId = await seedSpecialization({
        context: seed,
        name: specializationName,
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });
    }

    const skillId = await seedSkill({
      context: seed,
      specializationId,
      name: skillName,
      description: OLD_RESEARCH_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
    });
    rememberSkillId({ world: webWorld, name: skillName, skillId });
    await archiveSkillForE2e({ context: seed, skillId });
  },
);

Given(
  'skill {string} exists for specialization {string}',
  async ({ seed, world }, skillName: string, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationKey = specializationName.trim().toLowerCase();
    let specializationId =
      webWorld.specializationIds?.[specializationKey] ?? webWorld.specializationId;

    if (!specializationId) {
      specializationId = await seedSpecialization({
        context: seed,
        name: specializationName,
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });
    }

    const skillId = await seedSkill({
      context: seed,
      specializationId,
      name: skillName,
      description: CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
    });
    rememberSkillId({ world: webWorld, name: skillName, skillId });
  },
);

Given(
  'skill {string} is archived for specialization {string}',
  async ({ seed, world }, skillName: string, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    const skillKey = normalizeSkillKey(skillName);
    const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

    if (!skillId) {
      throw new Error(
        `skill "${skillName}" for specialization "${specializationName}" must be seeded before archiving.`,
      );
    }

    await archiveSkillForE2e({ context: seed, skillId });
  },
);

Given(
  'system agent {string} is assigned internal tool {string}',
  async ({ seed, world }, agentName: string, toolId: string) => {
    const webWorld = world as WebBddWorld;
    const agentKey = agentName.trim().toLowerCase();
    let systemAgentId = webWorld.storedFields?.[`systemAgentId:${agentKey}`];

    if (!systemAgentId) {
      systemAgentId = await seedRuntimeSystemAgent({
        context: seed,
        name: agentName,
        specializationId: webWorld.specializationId,
        assignedToolIds: [toolId],
      });
      webWorld.systemAgentId = systemAgentId;
      webWorld.storedFields = {
        ...(webWorld.storedFields ?? {}),
        [`systemAgentId:${agentKey}`]: systemAgentId,
      };
      return;
    }

    await assignInternalToolsToSystemAgent({
      context: seed,
      systemAgentId,
      assignedToolIds: [toolId],
    });
  },
);

Given('system agent {string} is seeded with skill-resolve assigned', async ({ seed, world }, agentName: string) => {
  const webWorld = world as WebBddWorld;
  const systemAgentId = await seedRuntimeSystemAgent({
    context: seed,
    name: agentName,
    assignedToolIds: ['skill-resolve'],
  });

  webWorld.systemAgentId = systemAgentId;
  webWorld.storedFields = {
    ...(webWorld.storedFields ?? {}),
    [`systemAgentId:${agentName.trim().toLowerCase()}`]: systemAgentId,
  };
});
