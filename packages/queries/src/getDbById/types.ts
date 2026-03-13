import type { Model } from "@vassembly/model";
import type { CommonDbQueryHandler } from "../types";

export interface GetDbByIdParams {
  id: string;
}

export interface GetDbByIdResponse<T extends Model> {
  data: T;
}

export type GetDbByIdHandler<T extends Model> = CommonDbQueryHandler<GetDbByIdParams, GetDbByIdResponse<T>>;