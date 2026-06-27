import { requireWorkspaceModule } from '@vassembly/e2e';
import type { SeedContext } from '@vassembly/e2e';

export interface InitDomainContextParams {
  context: SeedContext;
}

let domainInfrastructurePromise: Promise<void> | null = null;

export const initDomainContext = ({ context }: InitDomainContextParams): void => {
  process.env.MONGODB_URL = context.mongoUrl;
  process.env.MONGODB_DATABASE = context.mongoDatabase;
};

export const ensureDomainInfrastructure = async ({
  context,
}: InitDomainContextParams): Promise<void> => {
  initDomainContext({ context });

  if (domainInfrastructurePromise === null) {
    domainInfrastructurePromise = initializeDomainInfrastructure();
  }

  await domainInfrastructurePromise;
};

const initializeDomainInfrastructure = async (): Promise<void> => {
  const cacheModule = requireWorkspaceModule<typeof import('@vassembly/cache')>({
    moduleName: '@vassembly/cache',
  });
  const { CacheBackend } = requireWorkspaceModule<typeof import('@vassembly/config')>({
    moduleName: '@vassembly/config',
  });

  await cacheModule.initCache({ backend: CacheBackend.Memory, defaultTtlMs: 60_000 });
};
