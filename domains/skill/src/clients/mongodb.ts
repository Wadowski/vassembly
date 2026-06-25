import { MongoDbDAO } from '@vassembly/client-mongodb';

import { COLLECTION_NAME } from '../constants';
import type { SkillModel } from '../model';

export const skillMongodbDao = MongoDbDAO<SkillModel>({
  collectionName: COLLECTION_NAME,
});

export const getSkillsCollection = (): typeof skillMongodbDao.collection => {
  return skillMongodbDao.collection;
};

export const mongodbIndexes = async (): Promise<void> => {
  const collection = getSkillsCollection();

  await collection.createIndex({ specializationId: 1, name: 1 }, { unique: true });
  await collection.createIndex({ specializationId: 1 });
};
