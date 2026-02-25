import type { Model, ModelFactory } from "@vassembly/model";
import type { MongoDbDAO } from "@vassembly/client-mongodb";

export interface CommonDbCommandGeneratorParams<T extends Model> {
  factory: ModelFactory<T>;
  dao: MongoDbDAO<T>;
}

export type CommonDbCommandHandler<Params, Response> = (
  params: Params
) => Promise<Response>;
