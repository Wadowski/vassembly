import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { seedSpecialization } from '../utils/seedSpecialization';
import { seedRuntimeSystemAgent } from '../utils/skillRuntimeHelpers';
import { loadSystemAgentBaseRule } from '../utils/skillRuntimeContext';
import { seedSkillsForSpecialization } from '../utils/seedSkill';
import { getSystemAgentIdByName } from '../utils/seedSystemAgent';
import { normalizeSkillKey } from '../utils/seedSkill';
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

const rememberSystemAgentId = ({
  world,
  name,
  systemAgentId,
}: {
  world: WebBddWorld;
  name: string;
  systemAgentId: string;
}): void => {
  world.systemAgentId = systemAgentId;
  world.storedFields = {
    ...(world.storedFields ?? {}),
    [`systemAgentId:${name.trim().toLowerCase()}`]: systemAgentId,
  };
};

Given(
  'system agent {string} has specializationId for specialization {string}',
  async ({ seed, world }, agentName: string, specializationName: string) => {
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

    const systemAgentId = await seedRuntimeSystemAgent({
      context: seed,
      name: agentName,
      specializationId,
    });
    rememberSystemAgentId({ world: webWorld, name: agentName, systemAgentId });
  },
);

Given('system agent {string} has no specializationId', async ({ seed, world }, agentName: string) => {
  const webWorld = world as WebBddWorld;
  const resolvedName = agentName === 'Assistant' ? SYSTEM_AGENT_NAME.Assistant : agentName;
  const systemAgentId = await getSystemAgentIdByName({ context: seed, name: resolvedName });
  rememberSystemAgentId({ world: webWorld, name: agentName, systemAgentId });

  webWorld.storedFields = {
    ...(webWorld.storedFields ?? {}),
    [`baseRule:${agentName.trim().toLowerCase()}`]: await loadSystemAgentBaseRule({
      context: seed,
      systemAgentId,
    }),
  };
});

Given(
  'specialization {string} has enabled non-archived skills {string} and {string}',
  async ({ seed, world }, specializationName: string, firstSkill: string, secondSkill: string) => {
    const webWorld = world as WebBddWorld;
    const { specializationId, skillIds } = await seedSkillsForSpecialization({
      context: seed,
      specializationName,
      skills: [
        {
          name: firstSkill,
          description: CONTRACT_REVIEW_DESCRIPTION,
          rule: CONTRACT_REVIEW_RULE,
        },
        {
          name: secondSkill,
          description: LEGAL_RESEARCH_DESCRIPTION,
          rule: CONTRACT_REVIEW_RULE,
        },
      ],
    });

    rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });
    Object.entries(skillIds).forEach(([skillName, skillId]) => {
      rememberSkillId({ world: webWorld, name: skillName, skillId });
    });
  },
);
