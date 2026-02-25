import type { Model } from "@vassembly/model";
import type { CommonDbCommandHandler } from "../types";

export interface CreateDbParams<T extends Model> {
  data: Partial<T>;
}

export interface CreateDbResponse<T extends Model> {
  data: T;
}

export type CreateDbHandler<T extends Model> = CommonDbCommandHandler<
  CreateDbParams<T>,
  CreateDbResponse<T>
>;
