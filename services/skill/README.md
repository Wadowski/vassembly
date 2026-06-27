# @vassembly/service-skill

Service handlers for skill catalog reads and admin write operations.

**Consumers:** `apps/api` GraphQL resolvers and REST routes (`POST/PATCH/DELETE /skills`).

## Exports

### `getSkill({ skillId }): GetSkillResult`
Fetches a single skill by ID via `skillDomain.queries.getById`.

### `listSkillsBySpecialization(input): ListSkillsBySpecializationResult`
Lists skills for a specialization (paginated, optional search). Archived skills are excluded by the domain query.

### `createSkill(input): CreateSkillResult`
Creates a skill after verifying the specialization exists. Delegates to `skillDomain.commands.create`.

### `updateSkill(input): UpdateSkillResult`
Updates skill fields and scripts via `skillDomain.commands.update`.

### `archiveSkill({ adminUserId, skillId }): ArchiveSkillResult`
Soft-archives a skill. Asserts admin role, verifies the skill exists, then calls `skillDomain.commands.removeSoft`.

## Usage

```typescript
import skillService from '@vassembly/service-skill';

const { skill } = await skillService.getSkill({ skillId: '...' });
const { items } = await skillService.listSkillsBySpecialization({ specializationId: '...' });
const { skill: created } = await skillService.createSkill({ specializationId, name, description, rule, scripts });
const { skill: archived } = await skillService.archiveSkill({ adminUserId, skillId });
```

## Dependencies

- **@vassembly/domain-skill**: Skill queries, commands, and `toSkillResponse` mapper
- **@vassembly/domain-specialization**: Specialization existence check on create
- **@vassembly/domain-user**: Admin role assertion for archive
- **@vassembly/constants**: `AUTH_TOKEN_ROLE` for authorization
- **@vassembly/errors**: `NotFoundError` and related service errors
