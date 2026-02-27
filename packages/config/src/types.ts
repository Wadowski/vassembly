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
  aws: AwsConfig;
  deepSeekAi: DeepSeekAiConfig;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface S3Config {
  bucketName: string;
}

export interface SqsConfig {
  queueUrl: string;
}

export interface SesConfig {
  configurationSetName?: string;
}

export interface WebConfig {
  port: number;
}

export interface MongoDbConfig {
  url: string;
  database: string;
}

export interface DeepSeekAiConfig {
  apiKey: string;
  baseURL: string;
}