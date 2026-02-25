import type { Model, ModelFactory } from "@vassembly/model";
import type { MongoDbDAO } from "@vassembly/client-mongodb";

export interface CommonDbQueryGeneratorParams<T extends Model> {
  factory: ModelFactory<T>;
  dao: MongoDbDAO<T>;
}

export type CommonDbQueryHandler<Params, Response> = (params: Params) => Promise<Response>;
