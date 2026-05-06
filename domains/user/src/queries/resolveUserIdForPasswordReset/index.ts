import { encode } from "@vassembly/client-encoder";

import { userMongodbDao } from "../../clients";
import type { ResolveUserIdForPasswordResetParams } from "./types";

export const resolveUserIdForPasswordReset = async ({
  plainToken,
}: ResolveUserIdForPasswordResetParams): Promise<string | null> => {
  if (!plainToken.trim()) {
    return null;
  }

  const encodedToken = encode(plainToken);

  const user = await userMongodbDao.getManyRaw(
    {
      passwordResetExpiresAt: { $gt: new Date() },
      passwordResetToken: encodedToken,
      $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
    },
    { limit: 1 },
  );

  return user?.[0]?.id ?? null;
};
