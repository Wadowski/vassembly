import Anthropic from "@anthropic-ai/sdk";

import type { ListAnthropicModelsParams } from "./types";

export const listAnthropicModels = async ({
  apiKey,
}: ListAnthropicModelsParams): Promise<string[]> => {
  const client = new Anthropic({ apiKey });
  const models = await client.models.list();
  return models.data.map((model) => model.id);
};
