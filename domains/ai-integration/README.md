# @vassembly/domain-ai-integration

Domain package for user-owned AI integration credentials (Gemini, ChatGPT, LM Studio).

## Exports

- `commands` — create, update, removeSoft, restore
- `queries` — getById, getListForUser, getListByProvider
- `gqlSchema` — GraphQL types for credential list/detail DTOs
- `mongodbIndexes` — MongoDB index bootstrap
- `toAiIntegrationResponse` — maps model to public DTO (no secrets)
