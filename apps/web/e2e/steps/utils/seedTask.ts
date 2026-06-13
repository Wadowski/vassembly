import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

import { initDomainContext } from './initDomainContext';

const ASSISTANT_LOOKUP_RETRIES = 5;
const ASSISTANT_LOOKUP_RETRY_DELAY_MS = 250;

let taskDomainInitPromise: Promise<void> | null = null;

export interface TaskSeedContextParams {
  context: SeedContext;
}

export interface SeedTaskForUserParams extends TaskSeedContextParams {
  userId: string;
  description: string;
  title?: string | null;
  status?: string;
  agentAssignedId?: string | null;
  llmResponse?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  clearDescription?: boolean;
}

export const ensureTaskDomainIndexes = async ({ context }: TaskSeedContextParams): Promise<void> => {
  if (taskDomainInitPromise === null) {
    taskDomainInitPromise = initializeTaskDomain({ context });
  }

  await taskDomainInitPromise;
};

const initializeTaskDomain = async ({ context }: TaskSeedContextParams): Promise<void> => {
  initDomainContext({ context });

  const cacheModule = requireWorkspaceModule<typeof import('@vassembly/cache')>({
    moduleName: '@vassembly/cache',
  });
  const { CacheBackend } = requireWorkspaceModule<typeof import('@vassembly/config')>({
    moduleName: '@vassembly/config',
  });

  await cacheModule.initCache({ backend: CacheBackend.Memory, defaultTtlMs: 60_000 });

  const { init } = requireWorkspaceModule<typeof import('@vassembly/client-mongodb')>({
    moduleName: '@vassembly/client-mongodb',
  });
  const taskDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task')>({
    moduleName: '@vassembly/domain-task',
  });
  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });
  const aiDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });

  await init({
    indexFunctions: [
      taskDomain.default.mongodbIndexes,
      systemAgentDomain.default.mongodbIndexes,
      aiDomain.default.mongodbIndexes,
    ],
  });
};

export const ensureAssistantSystemAgent = async ({
  context,
}: TaskSeedContextParams): Promise<string> => {
  await ensureTaskDomainIndexes({ context });

  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  for (let attempt = 0; attempt < ASSISTANT_LOOKUP_RETRIES; attempt += 1) {
    try {
      const existing = await systemAgentDomain.default.queries.getActiveByName({
        name: SYSTEM_AGENT_NAME.Assistant,
      });
      const assistantId = existing.data.id;
      if (assistantId) {
        return assistantId;
      }
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, ASSISTANT_LOOKUP_RETRY_DELAY_MS * (attempt + 1));
      });
    }
  }

  throw new Error('Unable to resolve assistant system agent for e2e seeding');
};

export const seedAiCredentialForUser = async ({
  context,
  userId,
}: TaskSeedContextParams & { userId: string }): Promise<string> => {
  await ensureTaskDomainIndexes({ context });

  const aiDomain = requireWorkspaceModule<typeof import('@vassembly/domain-ai-integration')>({
    moduleName: '@vassembly/domain-ai-integration',
  });

  const result = await aiDomain.default.commands.create({
    userId,
    name: 'E2E Web AI Credential',
    provider: aiDomain.AiIntegrationProvider.Gemini,
    apiKey: 'e2e-web-test-api-key',
    model: 'gemini-2.0-flash',
  });

  const credentialId = result.data.id;
  if (!credentialId) {
    throw new Error('Seeded AI credential is missing an id');
  }

  return credentialId;
};

export const upsertSystemAgentPreference = async (
  params: TaskSeedContextParams & { userId: string; integrationCredentialId: string },
): Promise<void> => {
  const { userId, integrationCredentialId } = params;
  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  await systemAgentDomain.default.commands.upsertPreference({ userId, integrationCredentialId });
};
