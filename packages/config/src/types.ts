export enum Environment {
  Development = 'development',
  Production = 'production',
}

export interface Config {
  apps: {
    web: {
      port: number;
    };
    docs: {
      port: number;
    };
  };
}