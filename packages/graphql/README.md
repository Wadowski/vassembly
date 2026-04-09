# @vassembly/graphql

GraphQL common utilities package for building GraphQL schemas with Pothos.

## Features

- **Builder Factory**: Create a Pothos SchemaBuilder instance
- **Model Schema Definition**: Define GraphQL object types for domain models with automatic common fields
- **Resolver Application**: Register Query and Mutation fields
- **Schema Configuration**: Convert builder to GraphQL config for server integration

## Common Fields

All models automatically include these common fields (can be disabled with `includeCommonFields: false`):

- `id: ID` - Unique identifier
- `createdAt: DateTime` - Creation timestamp
- `updatedAt: DateTime` - Last update timestamp
- `removedAt: DateTime` - Soft delete timestamp (nullable)

## Usage

### 1. Domain Level - Define Schema

In `domains/[domain]/src/schema/schema.ts`:

```typescript
import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const defineUserSchema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: 'User',
    fields: (t) => ({
      email: t.exposeString('email', { nullable: true }),
      firstName: t.exposeString('firstName', { nullable: true }),
      lastName: t.exposeString('lastName', { nullable: true }),
      verifiedAt: t.expose('verifiedAt', { type: 'DateTime', nullable: true }),
    }),
  });
};
```

Common fields (`id`, `createdAt`, `updatedAt`, `removedAt`) are automatically included.

### 2. Service Level - Create Builder and Apply Resolvers

In `services/[service]/src/graphql/index.ts`:

```typescript
import { createBuilder, applyResolvers, buildGraphQLConfig } from '@vassembly/graphql';
import { defineUserSchema } from '@vassembly/domain-user';
import userDomain from '@vassembly/domain-user';

// Create builder instance
const builder = createBuilder();

// Register domain schemas
defineUserSchema(builder);

// Apply resolvers
applyResolvers({
  builder,
  queries: (t) => ({
    user: t.field({
      type: 'User',
      args: { id: t.arg.id({ required: true }) },
      resolve: async (_, args) => {
        return await userDomain.queries.getById({ id: args.id as string });
      },
    }),
  }),
});

// Build GraphQL config for server
export const graphqlConfig = buildGraphQLConfig({
  builder,
  path: '/graphql',
});
```

### 3. Server Level - Wire GraphQL

In `services/[service]/src/routes/index.ts`:

```typescript
import { createServer } from '@vassembly/server';
import { config } from '@vassembly/config';
import { graphqlConfig } from '../graphql';

const routes = [...]; // Your HTTP routes

const fastify = await createServer({
  routes,
  graphql: graphqlConfig,
});

fastify.listen({ port: config.services.auth.port });
```

## API Reference

### `createBuilder(): Builder`

Creates a new Pothos SchemaBuilder instance.

### `defineModelSchema(props): void`

Registers a GraphQL object type for a domain model.

**Parameters:**
- `builder: Builder` - The builder instance
- `name: string` - GraphQL type name
- `fields: (t) => FieldMap` - Fields definition function
- `includeCommonFields?: boolean` - Include common fields (default: true)

### `applyResolvers(props): void`

Registers Query and Mutation fields on the builder.

**Parameters:**
- `builder: Builder` - The builder instance
- `queries?: (t) => FieldMap` - Query fields
- `mutations?: (t) => FieldMap` - Mutation fields

### `buildGraphQLConfig(props): GraphQLConfigResult`

Builds the GraphQL configuration for server integration.

**Parameters:**
- `builder: Builder` - The builder instance
- `path?: string` - GraphQL endpoint path (default: '/graphql')

### `getCommonFields(t): FieldMap`

Helper function to get common fields directly (for custom implementations):

```typescript
import { getCommonFields } from '@vassembly/graphql';

const fields = (t) => ({
  ...getCommonFields(t),
  // your custom fields...
});
```

## Dependencies

- `@pothos/core` - GraphQL schema builder
- `graphql` - GraphQL specification implementation
