# @vassembly/client-langchain

Unified LangChain-based AI provider client for the Vassembly monorepo. Replaces separate `@vassembly/client-chatgpt`, `@vassembly/client-gemini`, and `@vassembly/client-lm-studio` packages with a single interface backed by LangChain chat models.

## Supported providers

| Provider | LangChain class | Required config | Optional config |
|----------|-----------------|-----------------|-----------------|
| `chatgpt` | `ChatOpenAI` | `apiKey` | `organizationId` |
| `gemini` | `ChatGoogleGenerativeAI` | `apiKey` | — |
| `lm_studio` | `ChatOpenAI` (custom base URL) | `baseUrl` | `apiKey` |

Provider identifiers match `AiIntegrationProvider` from `@vassembly/domain-ai-integration`.

## Usage

### Factory (recommended)

```typescript
import { createProviderClient } from "@vassembly/client-langchain";
import { AiIntegrationProvider } from "@vassembly/domain-ai-integration";

const client = createProviderClient({
  provider: AiIntegrationProvider.ChatGpt,
  apiKey: process.env.OPENAI_API_KEY,
});

const connection = await client.testConnection();
const models = await client.getModels();
const response = await client.invoke({
  model: "gpt-4",
  message: "Hello",
});
```

### Direct provider creation

```typescript
import { createGeminiProvider } from "@vassembly/client-langchain";

const client = createGeminiProvider({ apiKey: "your-api-key" });
```

## API

All providers implement `AiProviderClient`:

- `testConnection()` — verifies credentials by listing models; returns `{ success, models?, error? }` without throwing
- `getModels()` — returns available model IDs; throws `InternalError` on failure
- `invoke({ model, message })` — sends a user message to the model; throws `InternalError` on failure

## Architecture

- **Providers** (`src/providers/`) — create LangChain chat models and wire operations
- **Operations** (`src/operations/`) — shared `testConnection`, `getModels`, and `invokeWithChatModel` logic
- **Model listing** (`src/modelListing/`) — provider-specific model discovery via native SDKs (OpenAI, Google GenAI)

Invoke uses LangChain; model listing uses native SDKs because LangChain does not expose a universal models API.

## Adding a new provider

1. Add a provider constant to `@vassembly/domain-ai-integration` if needed
2. Create `src/providers/create<Name>Provider.ts` returning `AiProviderClient`
3. Add model listing in `src/modelListing/` if the provider needs custom discovery
4. Register the provider in `src/createProviderClient.ts`
5. Export the factory from `src/index.ts`
6. Add colocated tests with mocked LangChain and SDK dependencies

## Scripts

- `pnpm test` — run unit tests
- `pnpm check-types` — TypeScript check
- `pnpm lint` — ESLint
