import { mongoDb } from "./connection";
import {
  MongoDbDAOGenerator,
  MongoDbDAO as MongoDbDAOType,
  Model,
} from "./types";
import { flattenObject } from "./utils";

export const MongoDbDAO: MongoDbDAOGenerator = <T extends Model>({
  collectionName,
}) => {
  const collection = mongoDb.db.collection(collectionName);

  const transformToDeepUpdate = (data) => {
    const transformedObj = flattenObject(
      data?.toMongoDb ? data.toMongoDb({ isUpdate: true }) : data,
      (field) => {
        return field?._bsontype ? field?._bsontype !== "ObjectID" : true;
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

  const transactionOptions = (context) => {
    if (context) {
      return { session: context.session, returnOriginal: false };
    }

    return null;
  };

  const projectionOptions = (projection) => {
    if (projection) {
      return { projection };
    }

    return null;
  };

  const create: MongoDbDAOType<T>["create"] = async (data, options) => {
    const { insertedId } = await collection.insertOne(
      data.toMongoDb({ isCreate: true }),
      transactionOptions(options?.context)
    );
    return insertedId.toString();
  };

  const createMany: MongoDbDAOType<T>["createMany"] = async (data, options) => {
    const { insertedIds } = await collection.insertMany(
      data.map((d) => d.toMongoDb({ isCreate: true })),
      transactionOptions(options?.context)
    );
    return Object.values(insertedIds).map((insertedId) =>
      insertedId.toString()
    );
  };

  const get: MongoDbDAOType<T>["get"] = async (where, options = {}) => {
    const response = await collection.findOne(where.toMongoDb(), {
      ...projectionOptions(options?.projection),
      ...transactionOptions(options?.context),
    });
    return response
      ? ({ ...response, id: response._id.toString() } as unknown as T)
      : null;
  };

  const getMany: MongoDbDAOType<T>["getMany"] = async (where, options) => {
    const pipeline: Array<Record<string, any>> = [
      {
        $match: where.toMongoDb(),
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

  const getManyRaw: MongoDbDAOType<T>["getManyRaw"] = async (
    where,
    options
  ) => {
    const pipeline: Array<Record<string, any>> = [
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
    const query = where.toMongoDb();
    await collection.updateOne(
      query,
      { $set: set },
      transactionOptions(options?.context)
    );
  };

  const updateMany: MongoDbDAOType<T>["updateMany"] = async (
    where,
    data,
    options
  ) => {
    await collection.updateMany(
      where.toMongoDb(),
      { $set: transformToDeepUpdate(data) },
      transactionOptions(options?.context)
    );
  };

  const upsert: MongoDbDAOType<T>["upsert"] = async (where, data, options) => {
    const { upsertedId } = await collection.updateOne(
      where.toMongoDb(),
      { $set: transformToDeepUpdate(data) },
      { ...(transactionOptions(options?.context) ?? {}), upsert: true }
    );

    if (upsertedId) {
      return upsertedId.toString();
    }

    const existingDocument = await collection.findOne(where.toMongoDb());
    return existingDocument?._id?.toString();
  };

  const upsertMany: MongoDbDAOType<T>["upsertMany"] = async (
    where,
    data,
    options
  ) => {
    await collection.updateMany(
      where.toMongoDb(),
      { $set: transformToDeepUpdate(data) },
      { ...(transactionOptions(options?.context) ?? {}), upsert: true }
    );
  };

  const remove: MongoDbDAOType<T>["remove"] = async (where, options) => {
    await collection.updateOne(
      where.toMongoDb(),
      { $set: transformToDeepUpdate(where.toMongoDb({ isRemove: true })) },
      transactionOptions(options?.context)
    );
  };

  const removeMany: MongoDbDAOType<T>["removeMany"] = async (
    where,
    options
  ) => {
    await collection.updateMany(
      where.toMongoDb(),
      { $set: transformToDeepUpdate(where.toMongoDb({ isRemove: true })) },
      transactionOptions(options?.context)
    );
  };

  const removeHard: MongoDbDAOType<T>["removeHard"] = async (
    where,
    options
  ) => {
    await collection.deleteOne(
      where.toMongoDb(),
      transactionOptions(options?.context)
    );
  };

  const removeHardMany: MongoDbDAOType<T>["removeHardMany"] = async (
    where,
    options
  ) => {
    await collection.deleteMany(
      where.toMongoDb(),
      transactionOptions(options?.context)
    );
  };

  return {
    create,
    createMany,
    get,
    getMany,
    getManyRaw,
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
