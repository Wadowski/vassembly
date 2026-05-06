import type { UserPublicResponse } from "../../model";

export interface CreateDbUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserCommandResult {
  data: UserPublicResponse;
}