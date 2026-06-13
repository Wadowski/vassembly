import type { ClientSession, Collection } from "mongodb";
import type { Model } from "@vassembly/model";

export interface Context {
  init: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  session?: ClientSession;
}

export type ContextGenerator = () => Context;

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, number>;
  projection?: Record<string, unknown>;
  context?: ContextGenerator;
}

export interface MongoDbDAO<T extends Model> {
  create: (data: Partial<T>, options?: QueryOptions) => Promise<string>;
  createMany: (
    data: Array<Partial<T>>,
    options?: QueryOptions
  ) => Promise<string[]>;
  get: (where: Partial<T>, options?: QueryOptions) => Promise<Partial<T>>;
  getMany: (
    where: Partial<T>,
    options?: QueryOptions
  ) => Promise<Array<Partial<T>>>;
  getManyRaw: (
    where: Record<string, unknown>,
    options?: QueryOptions
  ) => Promise<Array<Partial<T>>>;
  getRaw: (
    where: Record<string, unknown>,
    options?: QueryOptions
  ) => Promise<Partial<T> | null>;
  update: (
    where: Partial<T>,
    data: Partial<T>,
    options?: QueryOptions
  ) => Promise<void>;
  updateMany: (
    where: Partial<T>,
    data: Partial<T>,
    options?: QueryOptions
  ) => Promise<void>;
  upsert: (
    where: Partial<T>,
    data: Partial<T>,
    options?: QueryOptions
  ) => Promise<string>;
  upsertMany: (
    where: Partial<T>,
    data: Partial<T>,
    options?: QueryOptions
  ) => Promise<void>;
  remove: (where: Partial<T>, options?: QueryOptions) => Promise<void>;
  removeMany: (where: Partial<T>, options?: QueryOptions) => Promise<void>;
  removeHard: (where: Partial<T>, options?: QueryOptions) => Promise<void>;
  removeHardMany: (where: Partial<T>, options?: QueryOptions) => Promise<void>;
  collection: Collection;
  transformToDeepUpdate: (data: Record<string, unknown>) => Record<string, unknown>;
}

export type MongoDbDAOGenerator = <T extends Model>(params: {
  collectionName: string;
}) => MongoDbDAO<T>;
