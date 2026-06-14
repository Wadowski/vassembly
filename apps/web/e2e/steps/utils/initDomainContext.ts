import type { SeedContext } from '@vassembly/e2e';

export interface InitDomainContextParams {
  context: SeedContext;
}

export const initDomainContext = ({ context }: InitDomainContextParams): void => {
  process.env.MONGODB_URL = context.mongoUrl;
  process.env.MONGODB_DATABASE = context.mongoDatabase;
};
