import type { Model } from "@vassembly/model";
import type { CommonDbCommandHandler } from "../types";

export interface UpdateDbParams<T extends Model> {
  id: string;
  data: Partial<T>;
}

export interface UpdateDbResponse<T extends Model> {
  data: T;
}

export type UpdateDbHandler<T extends Model> = CommonDbCommandHandler<
  UpdateDbParams<T>,
  UpdateDbResponse<T>
>;
