import { GoogleGenAI } from "@google/genai";

import type { ListGeminiModelsParams } from "./types";

const MODELS_PREFIX = "models/";
const GENERATE_CONTENT_ACTION = "generateContent";

const toModelId = (resourceName: string): string => {
  if (resourceName.startsWith(MODELS_PREFIX)) {
    return resourceName.slice(MODELS_PREFIX.length);
  }

  return resourceName;
};

export const listGeminiModels = async ({
  apiKey,
}: ListGeminiModelsParams): Promise<string[]> => {
  const client = new GoogleGenAI({ apiKey });
  const modelIds: string[] = [];
  const pager = await client.models.list();

  for await (const model of pager) {
    if (!model.name) {
      continue;
    }

    if (!model.supportedActions?.includes(GENERATE_CONTENT_ACTION)) {
      continue;
    }

    modelIds.push(toModelId(model.name));
  }

  return modelIds;
};
