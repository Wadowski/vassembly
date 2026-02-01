export enum Environment {
  Development = 'development',
  Production = 'production',
}

export interface Config {
  apps: {
    web: WebConfig;
    docs: WebConfig;
  };
  mongoDb: MongoDbConfig;
}

export interface WebConfig {
  port: number;
}

export interface MongoDbConfig {
  url: string;
  database: string;
}