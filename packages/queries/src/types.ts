import type { Model, ModelFactory } from "@vassembly/model";
import type { MongoDbDAOType } from "@vassembly/client-mongodb";
import type { z } from "zod";

export interface CommonDbQueryGeneratorParams<T extends Model> {
  factory: ModelFactory<T>;
  dao: MongoDbDAOType<T>;
  validationSchema?: z.ZodSchema;
}

export type CommonDbQueryHandler<Params, Response> = (params: Params) => Promise<Response>;
