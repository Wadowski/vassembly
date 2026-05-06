import { mongoDb } from "./connection";
export type { MongoDbDAO as MongoDbDAOType, QueryOptions } from "./types";
export { MongoDbDAO } from "./dao";

export { mongoDb };

export interface InitOptions {
  indexFunctions?: Array<() => Promise<void>>;
}

export const init = async (options?: InitOptions): Promise<void> => {
  await mongoDb.connect();

  if (options?.indexFunctions) {
    for (const indexFn of options.indexFunctions) {
      try {
        await indexFn();
      } catch (error) {
        console.error("Failed to ensure collection indexes", error);
      }
    }
  }
};
