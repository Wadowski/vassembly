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
  s3: S3Config;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface S3Config {}

export interface WebConfig {
  port: number;
}

export interface MongoDbConfig {
  url: string;
  database: string;
}