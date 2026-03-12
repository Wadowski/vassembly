import { mongoDb } from "./connection";
export type { MongoDbDAO as MongoDbDAOType, QueryOptions } from "./types";
export { MongoDbDAO } from "./dao";

export const init = async () => mongoDb.connect();
