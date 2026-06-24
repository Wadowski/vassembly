import { MongoDbDAO } from '@vassembly/client-mongodb';

import { AgentStatus } from '../constants';
import type { SystemAgentModel } from '../model/model';
import type { UserSystemAgentPreferenceModel } from '../model/preferenceModel';

export const SYSTEM_AGENT_COLLECTION_NAME = 'systemAgents';

export const USER_SYSTEM_AGENT_PREFERENCE_COLLECTION_NAME = 'userSystemAgentPreferences';

export const systemAgentMongodbDao = MongoDbDAO<SystemAgentModel>({
  collectionName: SYSTEM_AGENT_COLLECTION_NAME,
});

export const userSystemAgentPreferenceMongodbDao = MongoDbDAO<UserSystemAgentPreferenceModel>({
  collectionName: USER_SYSTEM_AGENT_PREFERENCE_COLLECTION_NAME,
});

export const getSystemAgentsCollection = (): typeof systemAgentMongodbDao.collection => {
  return systemAgentMongodbDao.collection;
};

export const getUserSystemAgentPreferencesCollection =
  (): typeof userSystemAgentPreferenceMongodbDao.collection => {
    return userSystemAgentPreferenceMongodbDao.collection;
  };

export const mongodbSystemAgentIndexes = async (): Promise<void> => {
  const collection = getSystemAgentsCollection();

  await collection.createIndex({ status: 1 });
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ updatedAt: -1 });
  await collection.createIndex(
    { name: 1 },
    {
      unique: true,
      partialFilterExpression: { status: AgentStatus.Active, removedAt: null },
    },
  );
  await collection.createIndex({ name: 'text', description: 'text' });
  await collection.createIndex({ specializationId: 1 }, { sparse: true });
};

export const mongodbPreferenceIndexes = async (): Promise<void> => {
  const collection = getUserSystemAgentPreferencesCollection();

  await collection.createIndex({ userId: 1 }, { unique: true });
  await collection.createIndex({ integrationCredentialId: 1 });
};

export const mongodbIndexes = async (): Promise<void> => {
  await mongodbSystemAgentIndexes();
  await mongodbPreferenceIndexes();
};
