import { compareHash } from "@vassembly/client-encoder";
import { UserModel } from "../../model";
import { getListUsersByQuery } from "../getListQuery";
import { VerifyCredentialsQuery } from "./types";
import { UnauthorizedError } from "@vassembly/errors";

export const verifyCredentials = async ({
  email,
  password,
}: VerifyCredentialsQuery): Promise<UserModel> => {
  const result = await getListUsersByQuery({ email, limit: 1 });

  if (result.data.length === 0) {
    throw new UnauthorizedError("Invalid email or password", { email });
  }

  const user = result.data[0]!;
  
  if (!user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password", { email });
  }

  const isPasswordValid = await compareHash({ text: password, hash: user.passwordHash });

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password", { email });
  }

  return user;
};
