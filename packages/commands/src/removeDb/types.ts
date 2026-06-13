import type { CommonDbCommandHandler } from "../types";

export interface RemoveDbParams {
  id: string;
}

export type RemoveDbResponse = {
  success: boolean;
};

export type RemoveDbHandler = CommonDbCommandHandler<
  RemoveDbParams,
  RemoveDbResponse
>;
