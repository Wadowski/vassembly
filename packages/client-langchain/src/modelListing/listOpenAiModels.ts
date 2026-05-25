import OpenAI from "openai";

import type { ListOpenAiModelsParams } from "./types";

export const listOpenAiModels = async ({
  apiKey,
  baseUrl,
  organizationId,
}: ListOpenAiModelsParams): Promise<string[]> => {
  const client = new OpenAI({
    apiKey,
    ...(baseUrl && { baseURL: baseUrl }),
    ...(organizationId && { organization: organizationId }),
  });

  const models = await client.models.list();
  return models.data.map((model) => model.id);
};
