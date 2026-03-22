import crypto from "crypto";

export const randomString = (size = 36) =>
  crypto.randomBytes(Math.ceil(size * 0.75)).toString("base64url").slice(0, size);