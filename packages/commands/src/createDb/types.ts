import type { Model } from "@vassembly/model";
import type { CommonDbCommandHandler } from "../types";

export type CreateDbParams<T extends Model> = Partial<T>;

export type CreateDbResponse<T extends Model> = {
  data: T;
};

export type CreateDbHandler<T extends Model> = CommonDbCommandHandler<
  CreateDbParams<T>,
  CreateDbResponse<T>
>;
