# @vassembly/mappers

Shared mapper primitives for cross-cutting data transformations across domains.

## Purpose

This package provides reusable utilities for data mapping operations that appear across multiple domains:

- **Date serialization** — Converting `Date` objects to ISO 8601 strings with validation
- **Required-field assertions** — Validating mandatory fields before mapping
- **Field operations** — Picking or omitting specific fields from objects

## Two-Tier Mapping Architecture

### Tier 1: Primitives (this package)

Utility functions for common transformations:

- `toIsoString` — Serialize a `Date` to ISO 8601 string with validation
- `toNullableIsoString` — Serialize optional `Date` to ISO string or null
- `mapTimestampFields` — Batch serialize multiple timestamp fields
- `assertRequiredFields` — Validate that required fields exist on an entity
- `pickFields` — Select specific fields from an object
- `omitFields` — Remove specific fields from an object

### Tier 2: Domain Mappers

Located in `domains/<name>/src/model/to*Response.ts`, domain mappers:
- Compose Tier 1 primitives
- Define domain-specific DTO shapes
- Handle audience variants (admin, public, detail views)
- Remain domain-owned and not extracted to shared infrastructure

## Example Usage

```typescript
// Domain mapper using shared primitives
import { assertRequiredFields, toIsoString } from '@vassembly/mappers';

export const toSystemAgentResponse = (agent: SystemAgentModel) => {
  assertRequiredFields({
    entity: agent,
    fields: ['id', 'name', 'createdAt'],
    entityName: 'System agent',
  });

  return {
    id: agent.id!,
    name: agent.name!,
    createdAt: toIsoString({ value: agent.createdAt!, fieldName: 'createdAt' }),
  };
};
```

## API Date Serialization Convention

All external DTO timestamp fields should be ISO 8601 strings with optional null:

```typescript
export interface ResponseDTO {
  createdAt: string; // ISO 8601
  updatedAt: string;
  deletedAt: string | null; // nullable timestamps
}
```

Internal models retain `Date` objects; only DTO mappers serialize.
