import type { Model } from "@vassembly/model";
import { mongoDb } from "./connection";
import {
  MongoDbDAOGenerator,
  MongoDbDAO as MongoDbDAOType,
  type ContextGenerator,
} from "./types";
import { flattenObject } from "./utils";

export const MongoDbDAO: MongoDbDAOGenerator = <T extends Model>({
  collectionName,
}: {
  collectionName: string;
}) => {
  const collection = mongoDb.db.collection(collectionName);

  const transformToDeepUpdate = (data: Record<string, unknown>): Record<string, unknown> => {
    const mongoData = typeof data.toMongoDb === "function"
      ? (data.toMongoDb as (options: { isUpdate: boolean }) => Record<string, unknown>)({ isUpdate: true })
      : data;
    const transformedObj = flattenObject(
      mongoData,
      (field) => {
        return (field as { _bsontype?: string })?._bsontype
          ? (field as { _bsontype?: string })._bsontype !== "ObjectID"
          : true;
      }
    );
    return Object.entries(transformedObj)
      .filter(([, value]) => value !== undefined)
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {}
      );
  };

  const transactionOptions = (contextGen: ContextGenerator | undefined) => {
    if (contextGen) {
      const context = contextGen();
      return { session: context.session, returnOriginal: false };
    }

    return undefined;
  };

  const projectionOptions = (projection: Record<string, unknown> | undefined) => {
    if (projection) {
      return { projection };
    }

    return undefined;
  };

  const create: MongoDbDAOType<T>["create"] = async (data, options) => {
    const mongoData = data.toMongoDb?.({ isCreate: true });
    if (!mongoData) throw new Error("Failed to convert data to MongoDB format");
    
    const { insertedId } = await collection.insertOne(
      mongoData,
      transactionOptions(options?.context)
    );
    return insertedId.toString();
  };

  const createMany: MongoDbDAOType<T>["createMany"] = async (data, options) => {
    const mongoData = data.map((d) => d.toMongoDb?.({ isCreate: true })).filter(Boolean) as Array<Record<string, unknown>>;
    if (!mongoData.length) throw new Error("Failed to convert data to MongoDB format");
    
    const { insertedIds } = await collection.insertMany(
      mongoData,
      transactionOptions(options?.context)
    );
    return Object.values(insertedIds).map((insertedId) =>
      insertedId.toString()
    );
  };

  const get: MongoDbDAOType<T>["get"] = async (where, options = {}) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) return {} as Partial<T>;
    
    const response = await collection.findOne(whereQuery, {
      ...projectionOptions(options?.projection),
      ...transactionOptions(options?.context),
    });
    return response
      ? ({ ...response, id: response._id.toString() } as unknown as Partial<T>)
      : ({} as Partial<T>);
  };

  const getMany: MongoDbDAOType<T>["getMany"] = async (where, options) => {
    const whereQuery = where.toMongoDb?.();
    const pipeline: Array<Record<string, unknown>> = [
      {
        $match: whereQuery ?? {},
      },
    ];
    if (options?.limit !== undefined) pipeline.push({ $limit: options?.limit });
    if (options?.offset !== undefined)
      pipeline.push({ $skip: options?.offset });

    const response = await collection.aggregate(pipeline).toArray();

    return response.map((r) => ({
      ...r,
      id: r._id.toString(),
    })) as unknown as T[];
  };

  const getRaw: MongoDbDAOType<T>["getRaw"] = async (where, options) => {
    const response = await collection.findOne(where, {
      ...projectionOptions(options?.projection),
      ...transactionOptions(options?.context),
    });
    return response
      ? ({ ...response, id: response._id.toString() } as unknown as Partial<T>)
      : null;
  };

  const getManyRaw: MongoDbDAOType<T>["getManyRaw"] = async (
    where,
    options
  ) => {
    const pipeline: Array<Record<string, unknown>> = [
      {
        $match: where,
      },
    ];
    if (options?.sort !== undefined) pipeline.push({ $sort: options?.sort });
    if (options?.offset !== undefined)
      pipeline.push({ $skip: options?.offset });
    if (options?.limit !== undefined) pipeline.push({ $limit: options?.limit });

    const response = await collection.aggregate(pipeline).toArray();

    return response.map((r) => ({
      ...r,
      id: r._id.toString(),
    })) as unknown as T[];
  };

  const update: MongoDbDAOType<T>["update"] = async (where, data, options) => {
    const set = transformToDeepUpdate(data);
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    await collection.updateOne(
      whereQuery,
      { $set: set },
      transactionOptions(options?.context)
    );
  };

  const updateMany: MongoDbDAOType<T>["updateMany"] = async (
    where,
    data,
    options
  ) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    await collection.updateMany(
      whereQuery,
      { $set: transformToDeepUpdate(data) },
      transactionOptions(options?.context)
    );
  };

  const upsert: MongoDbDAOType<T>["upsert"] = async (where, data, options) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    const { upsertedId } = await collection.updateOne(
      whereQuery,
      { $set: transformToDeepUpdate(data) },
      { ...(transactionOptions(options?.context) ?? {}), upsert: true }
    );

    if (upsertedId) {
      return upsertedId.toString();
    }

    const existingDocument = await collection.findOne(whereQuery);
    return existingDocument?._id?.toString() ?? "";
  };

  const upsertMany: MongoDbDAOType<T>["upsertMany"] = async (
    where,
    data,
    options
  ) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    await collection.updateMany(
      whereQuery,
      { $set: transformToDeepUpdate(data) },
      { ...(transactionOptions(options?.context) ?? {}), upsert: true }
    );
  };

  const remove: MongoDbDAOType<T>["remove"] = async (where, options) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    const removeData = where.toMongoDb?.({ isRemove: true });
    if (!removeData) throw new Error("Failed to generate remove data");
    
    await collection.updateOne(
      whereQuery,
      { $set: transformToDeepUpdate(removeData) },
      transactionOptions(options?.context)
    );
  };

  const removeMany: MongoDbDAOType<T>["removeMany"] = async (
    where,
    options
  ) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    const removeData = where.toMongoDb?.({ isRemove: true });
    if (!removeData) throw new Error("Failed to generate remove data");
    
    await collection.updateMany(
      whereQuery,
      { $set: transformToDeepUpdate(removeData) },
      transactionOptions(options?.context)
    );
  };

  const removeHard: MongoDbDAOType<T>["removeHard"] = async (
    where,
    options
  ) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    await collection.deleteOne(
      whereQuery,
      transactionOptions(options?.context)
    );
  };

  const removeHardMany: MongoDbDAOType<T>["removeHardMany"] = async (
    where,
    options
  ) => {
    const whereQuery = where.toMongoDb?.();
    if (!whereQuery) throw new Error("Invalid where clause");
    
    await collection.deleteMany(
      whereQuery,
      transactionOptions(options?.context)
    );
  };

  return {
    create,
    createMany,
    get,
    getMany,
    getManyRaw,
    getRaw,
    update,
    updateMany,
    upsert,
    upsertMany,
    remove,
    removeMany,
    removeHard,
    removeHardMany,
    collection,
    transformToDeepUpdate,
  };
};
