import { stopMongoDocker } from './mongoDocker';

const globalTeardown = async (): Promise<void> => {
  if (!process.env.E2E_STOP_MONGO) {
    return;
  }

  await stopMongoDocker();
};

export default globalTeardown;
