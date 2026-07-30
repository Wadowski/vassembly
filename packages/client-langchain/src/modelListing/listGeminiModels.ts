import type {
  GeminiListModelsApiResponse,
  ListGeminiModelsParams,
} from "./types";

const GEMINI_MODELS_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS_PREFIX = "models/";
const GENERATE_CONTENT_METHOD = "generateContent";

const toModelId = (resourceName: string): string => {
  if (resourceName.startsWith(MODELS_PREFIX)) {
    return resourceName.slice(MODELS_PREFIX.length);
  }

  return resourceName;
};

const buildListModelsUrl = ({
  apiKey,
  pageToken,
}: {
  apiKey: string;
  pageToken?: string;
}): string => {
  const url = new URL(GEMINI_MODELS_API_URL);
  url.searchParams.set("key", apiKey);

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  return url.toString();
};

const fetchModelsPage = async ({
  apiKey,
  pageToken,
}: {
  apiKey: string;
  pageToken?: string;
}): Promise<GeminiListModelsApiResponse> => {
  const response = await fetch(buildListModelsUrl({ apiKey, pageToken }));

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to list Gemini models (${response.status}): ${errorBody}`,
    );
  }

  return (await response.json()) as GeminiListModelsApiResponse;
};

export const listGeminiModels = async ({
  apiKey,
}: ListGeminiModelsParams): Promise<string[]> => {
  const modelIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const page = await fetchModelsPage({ apiKey, pageToken });

    for (const model of page.models ?? []) {
      if (!model.name) {
        continue;
      }

      if (!model.supportedGenerationMethods?.includes(GENERATE_CONTENT_METHOD)) {
        continue;
      }

      modelIds.push(toModelId(model.name));
    }

    pageToken = page.nextPageToken;
  } while (pageToken);

  return modelIds;
};
