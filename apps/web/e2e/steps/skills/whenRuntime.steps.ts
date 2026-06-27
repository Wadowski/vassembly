import { createBdd } from 'playwright-bdd';

import { bddTest, requireWorkspaceModule } from '@vassembly/e2e';

import { seedAgent } from '../utils/seedAgent';
import { getSystemAgentIdByName } from '../utils/seedSystemAgent';
import { resolveWorldPath } from '../utils/resolveWorldPath';
import { waitForSystemAgentFormReady } from '../utils/systemAgentsForm';
import {
  buildSystemMessageForSystemAgentInvoke,
  invokeResolveSkillTool,
  seedRuntimeSystemAgent,
} from '../utils/skillRuntimeHelpers';
import {
  resolveSpecializationIdFromWorld,
  resolveSystemAgentIdFromWorld,
} from '../utils/skillRuntimeContext';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('the system agent {string} is invoked', async ({ seed, world }, agentName: string) => {
  const webWorld = world as WebBddWorld;
  const systemAgentId = resolveSystemAgentIdFromWorld({ world: webWorld, agentName });
  const systemMessage = await buildSystemMessageForSystemAgentInvoke({
    context: seed,
    systemAgentId,
  });

  webWorld.storedFields = {
    ...(webWorld.storedFields ?? {}),
    systemMessage,
    lastInvokedAgentName: agentName,
  };
});

When('the personal agent {string} is invoked', async ({ seed, world }, agentName: string) => {
  const webWorld = world as WebBddWorld;

  if (!webWorld.auth?.userId) {
    throw new Error('User must be authenticated before invoking a personal agent.');
  }

  if (!webWorld.agentId) {
    webWorld.agentId = await seedAgent({
      context: seed,
      userId: webWorld.auth.userId,
      name: agentName,
      integrationCredentialId: webWorld.integrationCredentialId,
    });
  }

  const agentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-agent')>({
    moduleName: '@vassembly/domain-agent',
  });

  const agentResult = await agentDomain.default.queries.getById({
    id: webWorld.agentId,
    userId: webWorld.auth.userId,
  });

  webWorld.storedFields = {
    ...(webWorld.storedFields ?? {}),
    systemMessage: agentResult.data.rule,
    lastInvokedAgentName: agentName,
  };
});

When(
  'resolve_skill is called with specialization {string} and skillName {string}',
  async ({ seed, world }, specializationName: string, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationId = resolveSpecializationIdFromWorld({
      world: webWorld,
      specializationName,
    });

    let callerAgentId = webWorld.systemAgentId;
    try {
      callerAgentId = resolveSystemAgentIdFromWorld({ world: webWorld, agentName: 'Skill resolver' });
    } catch {
      callerAgentId = webWorld.systemAgentId;
    }

    if (!callerAgentId) {
      callerAgentId = await seedRuntimeSystemAgent({
        context: seed,
        name: 'E2E skill-resolve caller',
        assignedToolIds: ['skill-resolve'],
      });
      webWorld.systemAgentId = callerAgentId;
    }

    try {
      const result = await invokeResolveSkillTool({
        context: seed,
        callerAgentId,
        specializationId,
        skillName,
      });
      webWorld.storedFields = {
        ...(webWorld.storedFields ?? {}),
        resolveSkillResult: result,
        resolveSkillError: '',
        lastResolveSkillName: skillName,
      };
    } catch (error) {
      webWorld.storedFields = {
        ...(webWorld.storedFields ?? {}),
        resolveSkillResult: '',
        resolveSkillError: error instanceof Error ? error.message : String(error),
        lastResolveSkillName: skillName,
      };
    }
  },
);

When(
  'system agent {string} calls use_agent for {string} with skillName {string}',
  async ({ seed, world }, workerName: string, resolverName: string, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const workerAgentId = resolveSystemAgentIdFromWorld({ world: webWorld, agentName: workerName });
    const resolverAgentId = resolveSystemAgentIdFromWorld({ world: webWorld, agentName: resolverName });
    const specializationId = webWorld.specializationId;

    if (!specializationId) {
      throw new Error('specializationId is required for use_agent skill resolution flow.');
    }

    const resolveResult = await invokeResolveSkillTool({
      context: seed,
      callerAgentId: workerAgentId,
      specializationId,
      skillName,
    });

    const parsed = JSON.parse(resolveResult) as { rule?: string };

    webWorld.storedFields = {
      ...(webWorld.storedFields ?? {}),
      useAgentResult: parsed.rule ?? resolveResult,
      lastResolvedSkillName: skillName,
      delegatedResolverAgentId: resolverAgentId,
    };
  },
);

When('I archive skill {string} from the admin UI', async ({ page, world }, skillName: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const skillKey = skillName.trim().toLowerCase();
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId) {
    throw new Error(`skillId for "${skillName}" is required but not set on world.`);
  }

  await page.getByRole('button', { name: `Archive skill ${skillName}` }).click();
  await page.getByRole('button', { name: 'Archive skill', exact: true }).click();
});

When('I open the system agent edit page for {string}', async ({ page, seed, world }, agentName: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  webWorld.systemAgentId = await getSystemAgentIdByName({ context: seed, name: agentName });
  const resolvedPath = resolveWorldPath({
    path: '/agents/system-agents/{systemAgentId}/edit',
    world: webWorld,
  });

  await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
  await waitForSystemAgentFormReady({ page, heading: /Edit System Agent/i });
});
