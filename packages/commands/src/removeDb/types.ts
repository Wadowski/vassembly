import type { Model } from "@vassembly/model";
import type { CommonDbCommandHandler } from "../types";

export interface RemoveDbParams {
  id: string;
}

export type RemoveDbResponse = {
  success: boolean;
};

export type RemoveDbHandler<T extends Model> = CommonDbCommandHandler<
  RemoveDbParams,
  RemoveDbResponse
>;
