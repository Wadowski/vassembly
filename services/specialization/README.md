# @vassembly/service-specialization

Read-only service handlers for specialization admin queries.

## Handlers

- `listSpecializations` — paginated specialization catalog with optional search
- `getSpecialization` — specialization detail with resolved `agentIds` and `mcpIds`

## Usage

```typescript
import specializationService from '@vassembly/service-specialization';

const page = await specializationService.listSpecializations({
  page: 0,
  size: 20,
  search: 'finance',
});

const detail = await specializationService.getSpecialization({ id: 'spec-1' });
```
