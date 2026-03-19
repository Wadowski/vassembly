import userDomain from "@vassembly/domain-user";

import type { RegisterInput } from "./types";

export const register = async (input: RegisterInput) => {
  const { email, password, confirmPassword, firstName, lastName } = input;
  
  const user = await userDomain.commands.create({ email, password, confirmPassword, firstName, lastName });
  
  return { user: user.data };
};