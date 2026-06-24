import { MongoDbDAO } from '@vassembly/client-mongodb';

import { COLLECTION_NAME } from '../constants';
import type { SpecializationModel } from '../model';

export const specializationMongodbDao = MongoDbDAO<SpecializationModel>({
  collectionName: COLLECTION_NAME,
});

export const getSpecializationsCollection = (): typeof specializationMongodbDao.collection => {
  return specializationMongodbDao.collection;
};

const CASE_INSENSITIVE_COLLATION = { locale: 'en', strength: 2 };

export const mongodbIndexes = async (): Promise<void> => {
  const collection = getSpecializationsCollection();

  await collection.createIndex({ name: 1 }, { unique: true, collation: CASE_INSENSITIVE_COLLATION });
};
