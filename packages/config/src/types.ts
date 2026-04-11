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
  encoder: EncoderConfig;
  jwt: JwtConfig;
  services: {
    api: ServiceConfig;
  };
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

export interface EncoderConfig {
  secret: string;
  saltRounds: number;
  algorithm: string;
}

export interface JwtConfig {
  secret: string;
}

export interface ServiceConfig {
  port: number;
}