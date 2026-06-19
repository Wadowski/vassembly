export interface E2eConfigOptions {
  appName: 'web' | 'api' | string;
  featuresDir: string;
  stepsDirs: string[];
  baseURL?: string;
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
