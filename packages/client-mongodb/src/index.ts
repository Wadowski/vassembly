import { mongoDb } from "./connection";
export type { MongoDbDAO, QueryOptions } from "./types";

export const init = async () => mongoDb.connect();
