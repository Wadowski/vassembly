import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { MongoClient } from 'mongodb';

import { getE2ePackageRoot } from './packageRoot';

const execFileAsync = promisify(execFile);

export interface IsMongoReachableParams {
  mongoUrl: string;
}

export const isMongoReachable = async ({ mongoUrl }: IsMongoReachableParams): Promise<boolean> => {
  const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 3_000 });

  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.close();
  }
};

export const startMongoDocker = async (): Promise<void> => {
  const packageRoot = getE2ePackageRoot();
  const composeDir = path.resolve(packageRoot, '../client-mongodb');
  await execFileAsync('docker-compose', ['up', '-d'], { cwd: composeDir });
};

export const stopMongoDocker = async (): Promise<void> => {
  const packageRoot = getE2ePackageRoot();
  const composeDir = path.resolve(packageRoot, '../client-mongodb');
  await execFileAsync('docker-compose', ['down'], { cwd: composeDir });
};
