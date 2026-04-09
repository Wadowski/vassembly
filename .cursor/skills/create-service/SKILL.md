---
name: create-service
description: Create a new monorepo pacakge from a template in service folder
---

# Create Service Skill

This skill automates the creation of new service in the monorepo by scaffolding from template

## Functionality

The skill handles:
1. Prompting for service name if not provided
2. Prompting for used domains if not provided
3. Copying the service-empty template to the services directory
4. Updating package.json of a coppied template with the correct service name
5. Creating GraphQL setup file for domain schema and resolver integration

## Usage

### Create general files

When invoked, the skill will:
- Ask for service name (required)
- Create the service in `/services/{service-name}/`
- Update the service name in `package.json` to `@vassembly/{service-name}`
- Update the service name in `README.md` to `@vassembly/{service-name}`
- Ask for domains to add, provide list of possible options (required, options: check for possible domains in domains folder)
- Add selected domains to dependencies in package.json
- Create `src/graphql/index.ts` with GraphQL setup (builder creation, schema definition, resolvers)
- Add `@vassembly/graphql` dependency to `package.json`

### GraphQL Setup

After service creation, a GraphQL setup file is automatically created at `src/graphql/index.ts`:

```typescript
import { createBuilder, applyResolvers, buildGraphQLConfig } from '@vassembly/graphql';
import { define{DomainName}Schema } from '@vassembly/domain-{domain-name}';
import {domain}Domain from '@vassembly/domain-{domain-name}';
import type { GraphQLConfigResult } from '@vassembly/graphql';

const builder = createBuilder();

define{DomainName}Schema(builder);
// Add other domain schemas as needed

applyResolvers({
  builder,
  queries: (t) => ({
    // Add query resolvers here
  }),
  mutations: (t) => ({
    // Add mutation resolvers here
  }),
});

export const graphqlConfig: GraphQLConfigResult = buildGraphQLConfig({
  builder,
  path: '/graphql',
});
```

The routes/index.ts is updated to use `createServer` with the GraphQL config to serve both HTTP and GraphQL endpoints.

