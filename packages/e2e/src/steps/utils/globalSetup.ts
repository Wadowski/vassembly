import { getE2eEnvironment } from '../../config/environment';
import { isMongoReachable, startMongoDocker } from './mongoDocker';

const MONGO_STARTUP_RETRIES = 30;
const MONGO_STARTUP_DELAY_MS = 1_000;

const waitForMongo = async (mongoUrl: string): Promise<void> => {
  for (let attempt = 0; attempt < MONGO_STARTUP_RETRIES; attempt += 1) {
    const isReady = await isMongoReachable({ mongoUrl });
    if (isReady) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, MONGO_STARTUP_DELAY_MS);
    });
  }
  throw new Error('MongoDB did not become reachable during E2E global setup');
};

const globalSetup = async (): Promise<void> => {
  const environment = getE2eEnvironment();
  process.env.MONGODB_URL = environment.mongoUrl;
  process.env.MONGODB_DATABASE = environment.mongoDatabase;
  process.env.JWT_SECRET = environment.jwtSecret;

  const isReady = await isMongoReachable({ mongoUrl: environment.mongoUrl });
  if (!isReady) {
    await startMongoDocker();
    await waitForMongo(environment.mongoUrl);
  }
};

export default globalSetup;
