import type { UserPublicResponse } from "../../model";

export interface ResetPasswordCommand {
  token: string;
  password: string;
}

export interface ResetPasswordCommandResult {
  data: UserPublicResponse;
}
