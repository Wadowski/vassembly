import type { Model, ModelFactory } from "@vassembly/model";
import type { MongoDbDAO } from "@vassembly/client-mongodb";
import type { z } from "zod";

export interface CommonDbQueryGeneratorParams<T extends Model> {
  factory: ModelFactory<T>;
  dao: MongoDbDAO<T>;
  validationSchema?: z.ZodSchema;
}

export type CommonDbQueryHandler<Params, Response> = (params: Params) => Promise<Response>;
