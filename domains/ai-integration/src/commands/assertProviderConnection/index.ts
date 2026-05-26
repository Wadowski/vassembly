import { InternalError, WrongParamError } from "@vassembly/errors";

import { testProviderConnection } from "../testProviderConnection";
import type { AiProviderTestResult } from "../../clients";

interface AssertProviderConnectionParams {
  provider: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  organizationId?: string | null;
}

const AUTH_ERROR_PATTERNS = [
  /401/,
  /unauthorized/i,
  /invalid api key/i,
  /authentication/i,
  /incorrect api key/i,
];
const NETWORK_ERROR_PATTERNS = [
  /ENOTFOUND/,
  /ECONNREFUSED/,
  /network/i,
  /fetch failed/i,
  /timeout/i,
  /ETIMEDOUT/,
  /socket hang up/i,
];
const BASE_URL_ERROR_PATTERNS = [/invalid url/i, /cannot reach server/i, /base url/i];

const mapConnectionTestError = (error?: string): never => {
  const message = error ?? "Connection test failed";

  if (AUTH_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new WrongParamError("Invalid API key");
  }

  if (BASE_URL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new WrongParamError(message);
  }

  if (NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    console.error("AI integration connection test network error", message);
    throw new InternalError("Connection test failed due to network error");
  }

  throw new WrongParamError(`Connection test failed: ${message}`);
};

export const assertProviderConnection = async (
  params: AssertProviderConnectionParams,
): Promise<AiProviderTestResult> => {
  const result = await testProviderConnection(params);
  if (!result.success) {
    mapConnectionTestError(result.error);
  }
  return result;
};
