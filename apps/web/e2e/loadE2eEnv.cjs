const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MONGO_URL =
  'mongodb://user:pass@localhost:27017/?directConnection=true';
const DEFAULT_MONGO_DATABASE = 'vassembly_e2e';
const DEFAULT_JWT_SECRET = 'dev-jwt-secret';
const DEFAULT_WEB_BASE_URL = 'http://localhost:3001';
const DEFAULT_API_BASE_URL = 'http://localhost:5001';

const E2E_ENV_KEYS = new Set([
  'MONGODB_URL',
  'MONGODB_DATABASE',
  'JWT_SECRET',
  'ENCODER_SECRET',
  'NODE_ENV',
  'VASSEMBLY_E2E',
  'WEB_PORT',
  'API_PORT',
  'DOCS_PORT',
  'NEXT_PUBLIC_API_BASE_URL',
  'E2E_API_BASE_URL',
  'E2E_WEB_BASE_URL',
]);

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, 'utf-8');
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

const monorepoRoot = path.resolve(__dirname, '../../..');
const mergedFileEnv = {
  ...parseEnvFile(path.join(monorepoRoot, '.env')),
  ...parseEnvFile(path.join(monorepoRoot, '.env.e2e')),
};

for (const key of E2E_ENV_KEYS) {
  if (mergedFileEnv[key] !== undefined) {
    process.env[key] = mergedFileEnv[key];
  }
}

process.env.MONGODB_URL = process.env.MONGODB_URL || DEFAULT_MONGO_URL;
process.env.MONGODB_DATABASE = process.env.MONGODB_DATABASE || DEFAULT_MONGO_DATABASE;
process.env.JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
process.env.ENCODER_SECRET = process.env.ENCODER_SECRET || 'dev-encoder-secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.VASSEMBLY_E2E = process.env.VASSEMBLY_E2E || 'true';
process.env.WEB_PORT = process.env.WEB_PORT || mergedFileEnv.WEB_PORT || '3001';
process.env.API_PORT = process.env.API_PORT || mergedFileEnv.API_PORT || '5001';
process.env.DOCS_PORT = process.env.DOCS_PORT || mergedFileEnv.DOCS_PORT || '3002';
process.env.E2E_WEB_BASE_URL =
  process.env.E2E_WEB_BASE_URL || mergedFileEnv.E2E_WEB_BASE_URL || DEFAULT_WEB_BASE_URL;
process.env.E2E_API_BASE_URL =
  process.env.E2E_API_BASE_URL || mergedFileEnv.E2E_API_BASE_URL || DEFAULT_API_BASE_URL;
process.env.NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  mergedFileEnv.NEXT_PUBLIC_API_BASE_URL ||
  process.env.E2E_API_BASE_URL ||
  DEFAULT_API_BASE_URL;

if (typeof process.getBuiltinModule !== 'function') {
  process.getBuiltinModule = (name) => require(name);
}
