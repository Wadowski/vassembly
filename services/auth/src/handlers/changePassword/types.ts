import { z } from "zod";

import { CHANGE_PASSWORD_HANDLER_SCHEMA } from "./constants";

export type ChangePasswordInput = z.infer<typeof CHANGE_PASSWORD_HANDLER_SCHEMA>;

export interface ChangePasswordOutput {
  success: true;
}
