import { initCache } from '@vassembly/cache';
import { init as initMongoDb } from '@vassembly/client-mongodb';
import { CacheBackend } from '@vassembly/config';
import userDomain from '@vassembly/domain-user';

let seedInfrastructurePromise: Promise<void> | null = null;

export const ensureSeedInfrastructure = async (): Promise<void> => {
  if (seedInfrastructurePromise === null) {
    seedInfrastructurePromise = initializeSeedInfrastructure();
  }

  await seedInfrastructurePromise;
};

const initializeSeedInfrastructure = async (): Promise<void> => {
  await initCache({ backend: CacheBackend.Memory, defaultTtlMs: 60_000 });
  await initMongoDb({
    indexFunctions: [userDomain.mongodbIndexes],
  });
};
