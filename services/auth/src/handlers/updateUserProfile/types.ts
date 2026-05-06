import { z } from "zod";
import type { UserPublicResponse } from "@vassembly/domain-user";

import { UPDATE_USER_PROFILE_INPUT_SCHEMA } from "./constants";

export type UpdateUserProfileInput = z.infer<typeof UPDATE_USER_PROFILE_INPUT_SCHEMA>;

export interface UpdateUserProfileOutput {
  user: UserPublicResponse;
}
