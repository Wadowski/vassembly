export interface E2eWebServerConfig {
  package: string;
  url: string;
}

export interface E2eConfigOptions {
  appName: 'web' | 'api' | string;
  featuresDir: string;
  stepsDirs: string[];
  baseURL?: string;
  webServers?: E2eWebServerConfig[];
}

export interface E2eEnvironment {
  webBaseUrl: string;
  apiBaseUrl: string;
  mongoUrl: string;
  mongoDatabase: string;
  jwtSecret: string;
  consoleErrorPatterns: string[];
  requestLoopThreshold: number;
  enableDiagnostics: boolean;
}
