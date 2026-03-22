---
name: add-domain-command-query
description: Add new command or query to an existing domain based on user description
---

# Add Domain Command or Query Skill

This skill automates the creation of new command or query in domain by understanding user prompt and implementing it using existing clients, models, factories

## Functionality

The skill handles:
1. Prompting if not provided, for which domain the new handler needs to be added
2. Prompting if not provided, if it's command or query
3. Prompting if not provided, for new domain command/query name
4. Analyzing user prompt to understand how the new logic should looke like
5. If handler description lacks details or is missing completely, prompt user to provide it
6. understanding which clients, model, factories should be used
7. understanding if command/query requires custom logic over the existing common commands/queries

## Code rules

custom command/query should:
- use factories to create domain model
- use clients when using external pacakge, data source etc
- add validaiton only if needed if client does not handle it. Use zod validation for input validaiton
- add custom logic only if necessary

## Usage

When invoked, the skill will:
- Ask for domain name (required)
- Ask for domain command/query name (required)
- Ask if it's command or query (required)
- Create new folder in the domain in `/domains/{domain-name}/src/{commands/queries}/{handler-name}`
- Create a types.ts file in handler folder that will store command/query props type
- Create an index.ts file in handler folder, that will handle logic of the handler
- Create an index.test.ts file in handler folder, that will have test cases testing newly created file