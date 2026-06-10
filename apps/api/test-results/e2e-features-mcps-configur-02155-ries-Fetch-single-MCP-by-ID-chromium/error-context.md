# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/features/mcps/configuration-graphql.feature.spec.js >> MCP Configuration (GraphQL Queries) >> Fetch single MCP by ID
- Location: .features-gen/e2e/features/mcps/configuration-graphql.feature.spec.js:17:3

# Error details

```
MongoServerError: E11000 duplicate key error collection: vassembly_e2e.mcps index: slug_1 dup key: { slug: "claude-3-opus" }
```

# Test source

```ts
  1   | import type { Model } from "@vassembly/model";
  2   | import { mongoDb } from "./connection";
  3   | import {
  4   |   MongoDbDAOGenerator,
  5   |   MongoDbDAO as MongoDbDAOType,
  6   |   type ContextGenerator,
  7   | } from "./types";
  8   | import { flattenObject } from "./utils";
  9   | 
  10  | export const MongoDbDAO: MongoDbDAOGenerator = <T extends Model>({
  11  |   collectionName,
  12  | }: {
  13  |   collectionName: string;
  14  | }) => {
  15  |   const collection = mongoDb.db.collection(collectionName);
  16  | 
  17  |   const transformToDeepUpdate = (data: Record<string, any>): Record<string, any> => {
  18  |     const transformedObj = flattenObject(
  19  |       data?.toMongoDb ? data.toMongoDb({ isUpdate: true }) : data,
  20  |       (field) => {
  21  |         return field?._bsontype ? field?._bsontype !== "ObjectID" : true;
  22  |       }
  23  |     );
  24  |     return Object.entries(transformedObj)
  25  |       .filter(([, value]) => value !== undefined)
  26  |       .reduce(
  27  |         (acc, [key, value]) => ({
  28  |           ...acc,
  29  |           [key]: value,
  30  |         }),
  31  |         {}
  32  |       );
  33  |   };
  34  | 
  35  |   const transactionOptions = (contextGen: ContextGenerator | undefined) => {
  36  |     if (contextGen) {
  37  |       const context = contextGen();
  38  |       return { session: context.session, returnOriginal: false };
  39  |     }
  40  | 
  41  |     return undefined;
  42  |   };
  43  | 
  44  |   const projectionOptions = (projection: Record<string, any> | undefined) => {
  45  |     if (projection) {
  46  |       return { projection };
  47  |     }
  48  | 
  49  |     return undefined;
  50  |   };
  51  | 
  52  |   const create: MongoDbDAOType<T>["create"] = async (data, options) => {
  53  |     const mongoData = data.toMongoDb?.({ isCreate: true });
  54  |     if (!mongoData) throw new Error("Failed to convert data to MongoDB format");
  55  |     
  56  |     const { insertedId } = await collection.insertOne(
  57  |       mongoData,
  58  |       transactionOptions(options?.context)
  59  |     );
  60  |     return insertedId.toString();
  61  |   };
  62  | 
  63  |   const createMany: MongoDbDAOType<T>["createMany"] = async (data, options) => {
  64  |     const mongoData = data.map((d) => d.toMongoDb?.({ isCreate: true })).filter(Boolean) as Array<any>;
  65  |     if (!mongoData.length) throw new Error("Failed to convert data to MongoDB format");
  66  |     
  67  |     const { insertedIds } = await collection.insertMany(
  68  |       mongoData,
  69  |       transactionOptions(options?.context)
  70  |     );
  71  |     return Object.values(insertedIds).map((insertedId) =>
  72  |       insertedId.toString()
  73  |     );
  74  |   };
  75  | 
  76  |   const get: MongoDbDAOType<T>["get"] = async (where, options = {}) => {
  77  |     const whereQuery = where.toMongoDb?.();
  78  |     if (!whereQuery) return {} as Partial<T>;
> 79  |     
      |           ^ MongoServerError: E11000 duplicate key error collection: vassembly_e2e.mcps index: slug_1 dup key: { slug: "claude-3-opus" }
  80  |     const response = await collection.findOne(whereQuery, {
  81  |       ...projectionOptions(options?.projection),
  82  |       ...transactionOptions(options?.context),
  83  |     });
  84  |     return response
  85  |       ? ({ ...response, id: response._id.toString() } as unknown as Partial<T>)
  86  |       : ({} as Partial<T>);
  87  |   };
  88  | 
  89  |   const getMany: MongoDbDAOType<T>["getMany"] = async (where, options) => {
  90  |     const whereQuery = where.toMongoDb?.();
  91  |     const pipeline: Array<Record<string, any>> = [
  92  |       {
  93  |         $match: whereQuery ?? {},
  94  |       },
  95  |     ];
  96  |     if (options?.limit !== undefined) pipeline.push({ $limit: options?.limit });
  97  |     if (options?.offset !== undefined)
  98  |       pipeline.push({ $skip: options?.offset });
  99  | 
  100 |     const response = await collection.aggregate(pipeline).toArray();
  101 | 
  102 |     return response.map((r) => ({
  103 |       ...r,
  104 |       id: r._id.toString(),
  105 |     })) as unknown as T[];
  106 |   };
  107 | 
  108 |   const getRaw: MongoDbDAOType<T>["getRaw"] = async (where, options) => {
  109 |     const response = await collection.findOne(where, {
  110 |       ...projectionOptions(options?.projection),
  111 |       ...transactionOptions(options?.context),
  112 |     });
  113 |     return response
  114 |       ? ({ ...response, id: response._id.toString() } as unknown as Partial<T>)
  115 |       : null;
  116 |   };
  117 | 
  118 |   const getManyRaw: MongoDbDAOType<T>["getManyRaw"] = async (
  119 |     where,
  120 |     options
  121 |   ) => {
  122 |     const pipeline: Array<Record<string, any>> = [
  123 |       {
  124 |         $match: where,
  125 |       },
  126 |     ];
  127 |     if (options?.sort !== undefined) pipeline.push({ $sort: options?.sort });
  128 |     if (options?.offset !== undefined)
  129 |       pipeline.push({ $skip: options?.offset });
  130 |     if (options?.limit !== undefined) pipeline.push({ $limit: options?.limit });
  131 | 
  132 |     const response = await collection.aggregate(pipeline).toArray();
  133 | 
  134 |     return response.map((r) => ({
  135 |       ...r,
  136 |       id: r._id.toString(),
  137 |     })) as unknown as T[];
  138 |   };
  139 | 
  140 |   const update: MongoDbDAOType<T>["update"] = async (where, data, options) => {
  141 |     const set = transformToDeepUpdate(data);
  142 |     const whereQuery = where.toMongoDb?.();
  143 |     if (!whereQuery) throw new Error("Invalid where clause");
  144 |     
  145 |     await collection.updateOne(
  146 |       whereQuery,
  147 |       { $set: set },
  148 |       transactionOptions(options?.context)
  149 |     );
  150 |   };
  151 | 
  152 |   const updateMany: MongoDbDAOType<T>["updateMany"] = async (
  153 |     where,
  154 |     data,
  155 |     options
  156 |   ) => {
  157 |     const whereQuery = where.toMongoDb?.();
  158 |     if (!whereQuery) throw new Error("Invalid where clause");
  159 |     
  160 |     await collection.updateMany(
  161 |       whereQuery,
  162 |       { $set: transformToDeepUpdate(data) },
  163 |       transactionOptions(options?.context)
  164 |     );
  165 |   };
  166 | 
  167 |   const upsert: MongoDbDAOType<T>["upsert"] = async (where, data, options) => {
  168 |     const whereQuery = where.toMongoDb?.();
  169 |     if (!whereQuery) throw new Error("Invalid where clause");
  170 |     
  171 |     const { upsertedId } = await collection.updateOne(
  172 |       whereQuery,
  173 |       { $set: transformToDeepUpdate(data) },
  174 |       { ...(transactionOptions(options?.context) ?? {}), upsert: true }
  175 |     );
  176 | 
  177 |     if (upsertedId) {
  178 |       return upsertedId.toString();
  179 |     }
```