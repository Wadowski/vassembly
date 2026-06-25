# @vassembly/service-skill

Read-only service layer for skill catalog operations.

**Consumers:** `apps/api` GraphQL resolvers.

## Handlers

- `getSkill` — fetch a single skill by ID
- `listSkillsBySpecialization` — list skills for a specialization, sorted by name
