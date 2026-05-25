# @vassembly/domain-system-agent

Domain package for platform-managed system agents and per-user connection preferences.

## Collections

| Collection | Model | Purpose |
|------------|-------|---------|
| `systemAgents` | `SystemAgentModel` | Platform agent definitions (no `userId`) |
| `userSystemAgentPreferences` | `UserSystemAgentPreferenceModel` | Per-user AI credential preference for invoke |

## Exports

### Default export

- `mongodbIndexes` — bootstrap indexes for both collections

### Models

- `SystemAgentModel` — platform agent entity
- `UserSystemAgentPreferenceModel` — user connection preference entity
- `systemAgentFactory`, `systemAgentTranslationFactory` — system agent factories
- `userSystemAgentPreferenceFactory` — preference factory
- `AgentStatus`, `AgentCategory` — enums
- `toSystemAgentResponse` — admin DTO mapper (includes rule + audit fields)
- `toCatalogListItem`, `toCatalogDetail` — catalog DTO mappers (omit audit; list omits rule)

### Clients

- `systemAgentMongodbDao`, `userSystemAgentPreferenceMongodbDao` — MongoDB DAOs
- `getSystemAgentsCollection`, `getUserSystemAgentPreferencesCollection` — typed collection accessors
- `mongodbSystemAgentIndexes`, `mongodbPreferenceIndexes`, `mongodbIndexes` — index bootstrap

### Constants

- `SYSTEM_AGENT_NAME_MIN_LENGTH` (1), `SYSTEM_AGENT_NAME_MAX_LENGTH` (100)
- `SYSTEM_AGENT_RULE_MIN_LENGTH` (1), `SYSTEM_AGENT_RULE_MAX_LENGTH` (5000)
- `SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH` (500)
- `SYSTEM_AGENT_DEFAULT_STATUS` (`active`)

### Errors

- `SYSTEM_AGENT_ERROR_CODES` — stable API error codes
- `throwSystemAgentNameConflictError` — 409 name conflict
- `throwSystemAgentNotFoundError` — 404 missing/archived agent
- `throwSystemAgentConnectionRequiredError` — 422 no preference
- `throwSystemAgentConnectionInvalidError` — 422 invalid credential connection

## Field constraints

### `systemAgents`

| Field | Constraints |
|-------|-------------|
| `name` | Required; 1–100 chars; trim; unique among active (case-insensitive at query layer) |
| `rule` | Required; 1–5000 chars |
| `description` | Optional; max 500 chars |
| `category` | Optional; `coding`, `utility`, `onboarding`, `compliance` |
| `status` | `active` (default), `archived`, `disabled` |
| `createdByAdminId` | Required on create |
| `updatedByAdminId` | Required on every write |
| `removedAt` | `null` when active; set on archive |

### `userSystemAgentPreferences`

| Field | Constraints |
|-------|-------------|
| `userId` | Required; unique |
| `integrationCredentialId` | Required; ownership validated in service layer |
| `createdAt`, `updatedAt` | System-set |

## Planned (not yet implemented)

- `commands` — create, update, removeSoft, restore, upsertPreference, invoke
- `queries` — getById, getActiveById, getAdminList, getCatalogList, getPreferenceByUserId, assertUniqueActiveName
