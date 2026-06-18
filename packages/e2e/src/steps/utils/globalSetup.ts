import path from 'node:path';
import fs from 'node:fs';

// Load environment variables synchronously before any module imports
const loadE2eEnvironmentSync = (): void => {
  const monorepoRoot = path.resolve(__dirname, '../../../../..');
  
  const parseEnvFile = (filePath: string): Record<string, string> => {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const env: Record<string, string> = {};
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key) {
        env[key] = value;
      }
    });
    return env;
  };

  const fileEnv = {
    ...parseEnvFile(path.join(monorepoRoot, '.env')),
    ...parseEnvFile(path.join(monorepoRoot, '.env.e2e')),
  };

  const E2E_ENV_KEYS = [
    'MONGODB_URL',
    'MONGODB_DATABASE',
    'JWT_SECRET',
    'ENCODER_SECRET',
    'NODE_ENV',
    'VASSEMBLY_E2E',
    'WEB_PORT',
    'API_PORT',
    'DOCS_PORT',
  ];

  for (const key of E2E_ENV_KEYS) {
    if (fileEnv[key] !== undefined) {
      process.env[key] = fileEnv[key];
    }
  }
};

// MUST run before any other imports
loadE2eEnvironmentSync();

import { getE2eEnvironment } from '../../config/environment';
import { seedDatabase } from '../../seed/seedDatabase';
import { seedE2ESystemAgents } from '../../seed/seedE2ESystemAgents';
import { isMongoReachable } from './mongoDocker';

const MONGO_STARTUP_RETRIES = 30;
const MONGO_STARTUP_DELAY_MS = 1_000;

const waitForMongo = async (mongoUrl: string): Promise<void> => {
  for (let attempt = 0; attempt < MONGO_STARTUP_RETRIES; attempt += 1) {
    const isReady = await isMongoReachable({ mongoUrl });
    if (isReady) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, MONGO_STARTUP_DELAY_MS);
    });
  }
  throw new Error(
    'MongoDB is not reachable. Start it with: pnpm dev:e2e:mongo'
  );
};

const globalSetup = async (): Promise<void> => {
  const environment = getE2eEnvironment();
  process.env.MONGODB_URL = environment.mongoUrl;
  process.env.MONGODB_DATABASE = environment.mongoDatabase;
  process.env.JWT_SECRET = environment.jwtSecret;

  const isReady = await isMongoReachable({ mongoUrl: environment.mongoUrl });
  if (!isReady) {
    await waitForMongo(environment.mongoUrl);
  }

  await seedDatabase({
    context: {
      mongoUrl: environment.mongoUrl,
      mongoDatabase: environment.mongoDatabase,
    },
  });

  await seedE2ESystemAgents({
    context: {
      mongoUrl: environment.mongoUrl,
      mongoDatabase: environment.mongoDatabase,
    },
  });
};

export default globalSetup;