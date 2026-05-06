import userDomain from "@vassembly/domain-user";

import type { RegisterInput, RegisterOutput } from "./types";

export const register = async (input: RegisterInput): Promise<RegisterOutput> => {
  const { email, password, firstName, lastName } = input;
  
  const user = await userDomain.commands.create({ email, password, firstName, lastName });
  
  return { user: user.data };
};