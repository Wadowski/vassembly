---
name: add-service-handler
description: Add new handler to an existing service based on user description
---

# Add Service Handler Skill

This skill automates the creation of new handler in a service by understanding user prompt and orchestrating it using commands and queries from different domains. Service handlers act as thin orchestration layers that compose domain logics.

## Functionality

The skill handles:
1. Prompting if not provided, for which service the new handler needs to be added
2. Prompting if not provided, for service handler name
3. Analyzing user prompt to understand which domains and which commands or queries are needed to achieve the goal
4. If handler description lacks details or is missing completely, prompt user to provide it
5. Implementation of the handler using ONLY commands and queries from domains - no custom business logic

## Core Rules

**Service handlers must:**
- Use only commands and queries from domains to implement logic
- Not contain any business logic or data transformation
- May add validation only for data passed as props to commands or queries - validation should only check if data exists, not if it's correct. In this case always throw InternalError
- Act as thin orchestration layers that compose existing domain operations
- Not modify or extend domain logic

**If a required command or query does not exist:**
- Do not add logic to the handler
- Instead, use the add-domain-command-query skill to create the missing command/query in the appropriate domain

## Usage

When invoked, the skill will:
- Ask for service name (required)
- Ask for service handler name (required)
- Ask for handler description to understand what domains and commands/queries to compose
- Create new folder in the service at `/services/{service-name}/src/handlers/{handler-name}`
- Create a types.ts file in handler folder to store handler props type
- Create an index.ts file in handler folder that orchestrates domain commands and queries