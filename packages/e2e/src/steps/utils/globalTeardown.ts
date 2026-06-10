import { getE2eEnvironment } from '../../config/environment';
import { cleanupDatabase } from '../../seed/seedDatabase';
import { stopMongoDocker } from './mongoDocker';

const globalTeardown = async (): Promise<void> => {
  const environment = getE2eEnvironment();

  await cleanupDatabase({
    context: {
      mongoUrl: environment.mongoUrl,
      mongoDatabase: environment.mongoDatabase,
    },
  });

  if (!process.env.E2E_STOP_MONGO) {
    return;
  }

  await stopMongoDocker();
};

export default globalTeardown;
