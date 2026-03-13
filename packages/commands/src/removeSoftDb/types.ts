import type { Model } from "@vassembly/model";
import type { CommonDbCommandHandler } from "../types";

export interface RemoveSoftDbParams {
  id: string;
}

export interface RemoveSoftDbResponse<T extends Model> {
  data: T;
}

export type RemoveSoftDbHandler<T extends Model> = CommonDbCommandHandler<
  RemoveSoftDbParams,
  RemoveSoftDbResponse<T>
>;
