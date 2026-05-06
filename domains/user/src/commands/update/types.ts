import type { UserPublicResponse } from "../../model";

export interface UpdateUserCommandParams {
  id: string;
  data: {
    firstName?: string;
    lastName?: string;
    verifiedAt?: Date;
  };
}

export interface UpdateUserCommandResult {
  data: UserPublicResponse | undefined;
}
