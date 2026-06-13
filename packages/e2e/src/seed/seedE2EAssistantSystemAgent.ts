import { MongoClient, ObjectId } from 'mongodb';

import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

import type { SeedContext } from '../fixtures/types';

const E2E_ASSISTANT_ADMIN_ID = 'e2e-global-system-agent-admin';
const SYSTEM_AGENTS_COLLECTION = 'systemAgents';

export interface SeedE2EAssistantSystemAgentParams {
  context: SeedContext;
}

export const seedE2EAssistantSystemAgent = async ({
  context,
}: SeedE2EAssistantSystemAgentParams): Promise<void> => {
  const client = new MongoClient(context.mongoUrl);
  await client.connect();

  try {
    const collection = client.db(context.mongoDatabase).collection(SYSTEM_AGENTS_COLLECTION);
    const existing = await collection.findOne({
      name: SYSTEM_AGENT_NAME.Assistant,
      status: 'active',
      removedAt: null,
    });

    if (existing) {
      return;
    }

    const now = new Date();

    await collection.insertOne({
      _id: new ObjectId(),
      name: SYSTEM_AGENT_NAME.Assistant,
      rule: 'E2E assistant system agent rule',
      description: 'E2E assistant',
      status: 'active',
      createdByAdminId: E2E_ASSISTANT_ADMIN_ID,
      updatedByAdminId: E2E_ASSISTANT_ADMIN_ID,
      removedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  } finally {
    await client.close();
  }
};
