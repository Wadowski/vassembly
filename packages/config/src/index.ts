import developmentConfig from './development';
import productionConfig from './production';
import { Environment } from './types';

const ENVIRONMENT = (process.env.NODE_ENV as Environment) || Environment.Development;

const CONFIG_MAP = {
  [Environment.Development]: developmentConfig,
  [Environment.Production]: productionConfig,
};

export const config = CONFIG_MAP[ENVIRONMENT] || developmentConfig;