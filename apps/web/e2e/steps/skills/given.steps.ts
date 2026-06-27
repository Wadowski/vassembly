import { randomUUID } from 'node:crypto';

import { createBdd } from 'playwright-bdd';

import { bddTest, seedUser } from '@vassembly/e2e';

import { E2E_USER_PASSWORD, signInSeededUser } from '../utils/auth';
import { promoteUserToAdmin } from '../utils/promoteUserToAdmin';
import { seedSpecialization } from '../utils/seedSpecialization';
import {
  normalizeSkillKey,
  seedSkill,
  seedSkillsForSpecialization,
} from '../utils/seedSkill';
import { archiveSkillForE2e } from '../utils/skillStateHelpers';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const LEGAL_DESCRIPTION =
  'Covers legal research, contract drafting, and regulatory compliance.';

const CONTRACT_REVIEW_RULE = [
  'Review each contract clause for compliance risks.',
  'Flag ambiguous language before approval.',
  'Summarize findings for the legal team.',
].join('\n');

const LEGAL_RESEARCH_DESCRIPTION = 'Research case law and summarize findings for attorneys.';
const CONTRACT_REVIEW_DESCRIPTION = 'Validate contract clauses against policy requirements.';

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

Given('I am authenticated as admin', async ({ page, seed, world }) => {
  const email = `e2e-admin-${randomUUID()}@vassembly.test`;
  const user = await seedUser({
    email,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  if (!page) {
    return;
  }

  await promoteUserToAdmin({ context: seed, email: user.email });
  await signInSeededUser({ page, email: user.email });

  world.auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given('I am authenticated without admin role', async ({ page, seed, world }) => {
  const email = `e2e-user-${randomUUID()}@vassembly.test`;
  const user = await seedUser({
    email,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  if (!page) {
    return;
  }

  await signInSeededUser({ page, email: user.email });

  world.auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given(
  'a specialization {string} exists with {int} skills',
  async ({ seed, world }, specializationName: string, skillCount: number) => {
    const webWorld = world as WebBddWorld;

    if (skillCount === 0) {
      const specializationId = await seedSpecialization({
        context: seed,
        name: specializationName,
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });
      return;
    }

    const skills =
      skillCount >= 2
        ? [
            {
              name: 'contract-review',
              description: CONTRACT_REVIEW_DESCRIPTION,
              rule: CONTRACT_REVIEW_RULE,
            },
            {
              name: 'legal-research',
              description: LEGAL_RESEARCH_DESCRIPTION,
            },
          ]
        : [
            {
              name: 'contract-review',
              description: CONTRACT_REVIEW_DESCRIPTION,
              rule: CONTRACT_REVIEW_RULE,
            },
          ];

    const { specializationId, skillIds } = await seedSkillsForSpecialization({
      context: seed,
      specializationName,
      skills: skills.slice(0, skillCount),
    });

    rememberSpecializationId({ world: webWorld, name: specializationName, specializationId });

    Object.entries(skillIds).forEach(([skillName, skillId]) => {
      rememberSkillId({ world: webWorld, name: skillName, skillId });
    });
  },
);

Given(
  'specialization {string} has skill {string}',
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
      description:
        skillName === 'legal-research' ? LEGAL_RESEARCH_DESCRIPTION : CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId });
  },
);

Given(
  'skill {string} has a rule with workflow instructions',
  async ({ seed, world }, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const skillKey = normalizeSkillKey(skillName);
    const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

    if (!skillId || !webWorld.specializationId) {
      throw new Error(`skill "${skillName}" must be seeded before setting its rule.`);
    }

    const updatedSkillId = await seedSkill({
      context: seed,
      specializationId: webWorld.specializationId,
      name: skillName,
      description: CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId: updatedSkillId });
  },
);

Given(
  'skill {string} has scripts {string} and {string}',
  async ({ seed, world }, skillName: string, firstScript: string, secondScript: string) => {
    const webWorld = world as WebBddWorld;

    if (!webWorld.specializationId) {
      throw new Error('specializationId is required but not set on world.');
    }

    const skillId = await seedSkill({
      context: seed,
      specializationId: webWorld.specializationId,
      name: skillName,
      description: CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
      scripts: [
        {
          filename: firstScript,
          language: firstScript.endsWith('.py') ? 'python' : 'bash',
          content: `print("seeded ${firstScript}")\n`,
        },
        {
          filename: secondScript,
          language: secondScript.endsWith('.py') ? 'python' : 'bash',
          content: `echo "seeded ${secondScript}"\n`,
        },
      ],
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId });
  },
);

Given(
  'skill {string} has a rule but no scripts',
  async ({ seed, world }, skillName: string) => {
    const webWorld = world as WebBddWorld;

    if (!webWorld.specializationId) {
      throw new Error('specializationId is required but not set on world.');
    }

    const skillId = await seedSkill({
      context: seed,
      specializationId: webWorld.specializationId,
      name: skillName,
      description: LEGAL_RESEARCH_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
      scripts: [],
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId });
  },
);

Given(
  'skill {string} has script {string} with language {string}',
  async ({ seed, world }, skillName: string, filename: string, language: string) => {
    const webWorld = world as WebBddWorld;

    if (!webWorld.specializationId) {
      const specializationId = await seedSpecialization({
        context: seed,
        name: 'E2E Skills',
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: 'E2E Skills', specializationId });
    }

    const normalizedLanguage = language.trim().toLowerCase();
    const scriptLanguage =
      normalizedLanguage === 'python'
        ? 'python'
        : normalizedLanguage === 'nodejs'
          ? 'nodejs'
          : 'bash';

    const contentByLanguage: Record<string, string> = {
      python: 'def validate():\n    return True\n',
      nodejs: 'export function build() {\n  return true;\n}\n',
      bash: '#!/bin/bash\necho "setup complete"\n',
    };

    const skillId = await seedSkill({
      context: seed,
      specializationId: webWorld.specializationId,
      name: skillName,
      description: CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
      scripts: [
        {
          filename,
          language: scriptLanguage,
          content: contentByLanguage[scriptLanguage],
        },
      ],
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId });
    webWorld.storedFields = {
      ...(webWorld.storedFields ?? {}),
      activeSkillName: skillName,
    };
  },
);

Given(
  'a skill has script {string} with language {string}',
  async ({ seed, world }, filename: string, language: string) => {
    const webWorld = world as WebBddWorld;

    if (!webWorld.specializationId) {
      const specializationId = await seedSpecialization({
        context: seed,
        name: 'E2E Skills',
        description: LEGAL_DESCRIPTION,
      });
      rememberSpecializationId({ world: webWorld, name: 'E2E Skills', specializationId });
    }

    const skillName = `skill-for-${filename.replace(/[^a-z0-9]+/gi, '-')}`;

    const normalizedLanguage = language.trim().toLowerCase();
    const scriptLanguage =
      normalizedLanguage === 'python'
        ? 'python'
        : normalizedLanguage === 'nodejs'
          ? 'nodejs'
          : 'bash';

    const contentByLanguage: Record<string, string> = {
      python: 'def validate():\n    return True\n',
      nodejs: 'export function build() {\n  return true;\n}\n',
      bash: '#!/bin/bash\necho "setup complete"\n',
    };

    const skillId = await seedSkill({
      context: seed,
      specializationId: webWorld.specializationId!,
      name: skillName,
      description: CONTRACT_REVIEW_DESCRIPTION,
      rule: CONTRACT_REVIEW_RULE,
      scripts: [
        {
          filename,
          language: scriptLanguage,
          content: contentByLanguage[scriptLanguage],
        },
      ],
    });

    rememberSkillId({ world: webWorld, name: skillName, skillId });
    webWorld.storedFields = {
      ...(webWorld.storedFields ?? {}),
      activeSkillName: skillName,
    };
  },
);

Given(
  'skill {string} exists and is not archived',
  async ({ world }, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const skillKey = normalizeSkillKey(skillName);
    const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

    if (!skillId) {
      throw new Error(`skill "${skillName}" must be seeded before archive scenario.`);
    }
  },
);

Given('skill {string} is archived', async ({ seed, world }, skillName: string) => {
  const webWorld = world as WebBddWorld;
  const skillKey = normalizeSkillKey(skillName);
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId) {
    throw new Error(`skill "${skillName}" must be seeded before archiving.`);
  }

  await archiveSkillForE2e({ context: seed, skillId });
});
