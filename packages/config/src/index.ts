import developmentConfig from './development';
import e2eConfig from './e2e';
import productionConfig from './production';
import { Environment } from './types';

export { CacheBackend, Environment } from './types';
export { E2E_API_PORT, E2E_DOCS_PORT, E2E_WEB_PORT } from './e2e';
export { validatePlatformAiConfig } from './validatePlatformAiConfig';
export type {
  CacheConfig,
  Config,
  ExecutionConfig,
  McpProxyKind,
  McpServerContainerConfig,
  McpServersConfig,
  McpTransport,
  PlatformAiConfig,
  RedisConfig,
  SkillExecutionBackend,
  SkillScriptStorageConfig,
  SkillsConfig,
} from './types';
export { buildMcpServersConfig } from './buildMcpServersConfig';

const CONFIG_MAP = {
  [Environment.Development]: developmentConfig,
  [Environment.Production]: productionConfig,
  [Environment.Testing]: e2eConfig,
};

const resolveConfig = () => {
  if (process.env.VASSEMBLY_E2E === 'true') {
    return e2eConfig;
  }

  const environment = (process.env.NODE_ENV as Environment) || Environment.Development;
  return CONFIG_MAP[environment] || developmentConfig;
};

export const config = resolveConfig();