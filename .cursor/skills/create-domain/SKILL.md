---
name: create-domain
description: Create a new monorepo pacakge from a template in domains folder
---

# Create Domain Skill

This skill automates the creation of new domain in the monorepo by scaffolding from template

## Functionality

The skill handles:
1. Prompting for domain name if not provided
2. Prompting for commands if not provided
3. Prompting for queries if not provided
4. Prompting for clients if not provided
5. If user includes domain model fields add them to model
6. Copying the domain-empty template to the domains directory
7. Updating package.json of a coppied template with the correct domain name
8. Creating GraphQL schema file with model definition

If prompted to create a command or query use add-domain-command-query skill.

## Usage

### Create general files

When invoked, the skill will:
- Ask for domain name (required)
- Create the domain in `/domains/{domain-name}/`
- Update the domain name in `package.json` to `@vassembly/{domain-name}`
- Update the domain name in `README.md` to `@vassembly/{domain-name}`
- Ask for commands to add, provide list of possible options (required, options: check for possible commands in @vassembly/commands package)
- Ask for queries to add, provide list of possible options (required, options: check for possible queries in @vassembly/queries package)
- Copy relevant commands based on selected options. Use domain name in pascal case instead of "domain" text
- Copy relevant queries based on selected options. Use domain name in pascal case instead of "domain" text
- In model and factories use domain name instead of "domain" text
- Ask if model will have translations. If yes use ModelWithTranslations and keep translationFactory.
- In clients use domain name instead of "domain" e.g. use domain name in plural format for collection name in mongodb client
- Create `src/model/graphql.ts` with GraphQL schema definition using `defineModelSchema`
- Add `@vassembly/graphql` dependency to `package.json`

### GraphQL Schema

After domain creation, a GraphQL schema file is automatically created at `src/model/sgraphql.ts`:

```typescript
import { defineModelSchema } from '@vassembly/graphql';
import type { Builder } from '@vassembly/graphql';

export const define{DomainName}Schema = (builder: Builder): void => {
  defineModelSchema({
    builder,
    name: '{DomainName}',
    fields: (t) => ({
      // Add domain-specific fields here
      // Common fields (id, createdAt, updatedAt, removedAt) are automatically included
    }),
  });
};
```

Replace `{DomainName}` with the domain name in PascalCase and add domain-specific fields to the fields object.

