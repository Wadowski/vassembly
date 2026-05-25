import { UnauthorizedError } from "@vassembly/errors";

import { getById } from "../../queries";
import type { InvokeAgentParams, InvokeAgentResult } from "./types";

export const invoke = async (params: InvokeAgentParams): Promise<InvokeAgentResult> => {
  const { modeledProviderClient, agentId, userId } = params;

  const { data: agent } = await getById({ id: agentId, userId });

  if (!agent) {
    throw new UnauthorizedError("Agent not found or access denied");
  }

  return modeledProviderClient.invoke(agent.rule ?? "");
};
