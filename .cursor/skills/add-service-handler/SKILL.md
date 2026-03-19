---
name: add-service-handler
description: Add new handler to an existing service based on user description
---

# Add Service Handler Skill

This skill automates the creation of new handler in service by understanding user prompt and implementing it using domains commands and queries

## Functionality

The skill handles:
1. Prompting if not provided, for which service the new handler needs to be added
2. Prompting if not provided, for service handler name
3. Analyzing user prompt to understand which domains and which command or queries needs to be used to achieve it
4. If handler description lacks details or is missing completely, prompt user to provide it
5. Implemention of the logic in handler using only commands and queries from domains.

This skill should only implement code in services folder.
If logic must be implemented outside of services, use other skills to do it
Do not add any logic to a service, not validate anything, not add any logic here. Just use existing domain logic in commands and queries.
If command or query does not exist, add new one using skill add-domain-command-query

## Usage

When invoked, the skill will:
- Ask for service name (required)
- Ask for service handler name (required)
- Create new folder in the services in `/services/{service-name}/handlers/{handler-name}`
- Create a types.ts file in handler folder that will store handler props type
- Create an index.ts file in handler folder, that will handle logic of the handler