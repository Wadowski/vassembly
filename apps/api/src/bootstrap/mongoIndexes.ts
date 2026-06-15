import { init as initMongoDb } from '@vassembly/client-mongodb';
import { mongodbIndexes as agentMongodbIndexes } from '@vassembly/domain-agent';
import { mongodbIndexes as aiIntegrationMongodbIndexes } from '@vassembly/domain-ai-integration';
import { mongodbIndexes as mcpMongodbIndexes } from '@vassembly/domain-mcp';
import { mongodbIndexes as systemAgentMongodbIndexes } from '@vassembly/domain-system-agent';
import { mongodbIndexes as taskMongodbIndexes } from '@vassembly/domain-task';
import { mongodbIndexes as taskProgressMongodbIndexes } from '@vassembly/domain-task-progress';
import { setupUserMcpConfigIndexes } from '@vassembly/domain-user-mcp-config';
import { mongodbIndexes as userMongodbIndexes } from '@vassembly/domain-user';

export interface MongoIndexSpec {
  key: Record<string, number>;
  options?: {
    unique?: boolean;
  };
}

export const USER_MCP_CONFIG_INDEX_SPECS: MongoIndexSpec[] = [
  {
    key: { userId: 1, mcpId: 1 },
    options: { unique: true },
  },
  {
    key: { userId: 1 },
    options: {},
  },
  {
    key: { mcpId: 1 },
    options: {},
  },
  {
    key: { userId: 1, updatedAt: -1 },
    options: {},
  },
  {
    key: { lastTestedAt: -1 },
    options: {},
  },
];

export const getApiMongoIndexFunctions = (): Array<() => Promise<void>> => [
  userMongodbIndexes,
  agentMongodbIndexes,
  aiIntegrationMongodbIndexes,
  systemAgentMongodbIndexes,
  taskMongodbIndexes,
  mcpMongodbIndexes,
  setupUserMcpConfigIndexes,
  taskProgressMongodbIndexes,
];

export const registerApiMongoIndexes = async (): Promise<void> => {
  await initMongoDb({
    indexFunctions: getApiMongoIndexFunctions(),
  });
};
