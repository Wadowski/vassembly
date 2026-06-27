import { CUSTOM_HEADERS } from "@vassembly/constants";
import * as authTokenDomain from "@vassembly/domain-auth-token";
import { UnauthorizedError } from "@vassembly/errors";

import type { AuthorizeRequestInput, AuthorizeRequestOutput } from "./types";

const extractAuthToken = (headers: Record<string, string>): string | undefined => {
  const fromHeader = headers[CUSTOM_HEADERS.AuthToken];
  if (typeof fromHeader === "string" && fromHeader.trim() !== "") {
    return fromHeader.trim();
  }
  const authorization = headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return undefined;
};

export const authorizeRequest = async (
  input: AuthorizeRequestInput,
): Promise<AuthorizeRequestOutput> => {
  const { headers } = input;

  const token = extractAuthToken(headers);
  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  const verified = await authTokenDomain.queries.verify({ token });
  if (!verified.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const role = verified.role ?? "user";
  const onboardingCompleted = verified.onboardingCompleted ?? true;

  return { userId: verified.userId, role, onboardingCompleted };
};
