import type { Model } from "@vassembly/model";
import type { QueryOptions } from "@vassembly/client-mongodb";
import type { CommonDbQueryHandler } from "../types";

export type GetListDbByQueryParams<T extends Model> = Partial<T> & Pick<QueryOptions, "limit" | "offset">;

export interface GetListDbByIdResponse<T extends Model> {
  data: Array<T>;
}

export type GetListDbByQueryHandler<T extends Model> = CommonDbQueryHandler<GetListDbByQueryParams<T>, GetListDbByIdResponse<T>>;