import { MongoClient } from "mongodb";
import { config } from "@vassembly/config";
import { logger } from "@vassembly/logger";

export const MongoDbConnection = ({
  url = config.mongoDb.url,
  dbName = config.mongoDb.database,
} = {}) => {
  const client = new MongoClient(url);
  const db = client.db(dbName);

  const connect = async () => {
    await client.connect();
    logger("MongoDB successfully connected", {
      meta: { sessionId: "APPLICATION_SETUP" },
    });
  };

  return {
    client,
    db,
    connect,
  };
};

export const mongoDb = MongoDbConnection();
