export enum Environment {
  Development = 'development',
  Production = 'production',
  Testing = 'testing',
}

export enum CacheBackend {
  Memory = 'memory',
  Redis = 'redis',
}

export interface CacheConfig {
  backend: CacheBackend;
  defaultTtlMs: number;
}

export interface RedisConfig {
  url: string;
}

export interface SkillScriptStorageConfig {
  bucketName: string;
  localRootPath?: string;
}

export type SkillExecutionBackend = 'local' | 'cloud';

export interface SandboxLocalConfig {
  workerUrl: string;
}

export interface SandboxCloudConfig {
  workerUrl: string;
  apiKey?: string;
  warmPoolSize: number;
}

export interface ExecutionConfig {
  backend: SkillExecutionBackend;
  stdoutMaxBytes: number;
  stderrMaxBytes: number;
  memoryLimitMb: number;
  local: SandboxLocalConfig;
  cloud: SandboxCloudConfig;
}

export interface SkillsConfig {
  scriptStorage: SkillScriptStorageConfig;
  execution: ExecutionConfig;
}

export interface PlatformAiConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  organizationId?: string;
}

export interface Config {
  environment: Environment;
  apps: {
    web: WebConfig;
    docs: WebConfig;
  };
  cache: CacheConfig;
  redis?: RedisConfig;
  mongoDb: MongoDbConfig;
  aws: AwsConfig;
  /** @deprecated Superseded by platformAi; no new readers */
  deepSeekAi: DeepSeekAiConfig;
  platformAi: PlatformAiConfig;
  encoder: EncoderConfig;
  jwt: JwtConfig;
  skills: SkillsConfig;
  services: {
    api: ServiceConfig;
  };
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  ses: SesConfig;
}

export interface S3Config {
  bucketName: string;
}

export interface SqsConfig {
  queueUrl: string;
}

export interface SesConfig {
  configurationSetName?: string;
  passwordResetTemplateName: string;
  emailVerificationTemplateName: string;
  fromEmail: string;
}

export interface WebConfig {
  port: number;
  passwordResetUrl?: string;
  emailVerificationUrl?: string;
}

export interface MongoDbConfig {
  url: string;
  database: string;
}

/** @deprecated Superseded by platformAi; no new readers */
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
  allowedOrigins?: string[];
}
