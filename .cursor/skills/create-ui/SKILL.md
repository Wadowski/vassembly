---
name: create-ui
description: Create a new UI component package from a template in ui folder. Use when the user wants to create a new reusable React component for the monorepo.
---

# Create UI Component Skill

This skill automates the creation of new UI component packages in the monorepo by scaffolding from a template.

## Functionality

The skill handles:
1. Prompting for component name if not provided
2. Copying the template-empty template to the ui directory
3. Updating package.json with the correct component name
4. Updating README.md with the correct component name
5. Updating component.tsx with the correct component name
6. Updating component.module.scss with the correct component name
7. Updating componentProps in types.ts with the correct component name

## Usage

When invoked, the skill will:
- Ask for component name (required)
- Create the component in `/ui/{component-name}/`
- Update the package name in `package.json` to `@vassembly/ui-{component-name}`
- Update the package name in `README.md` to `@vassembly/ui-{component-name}`
- Update the component file name to `{componentName}.tsx`
- Update the component styling file name to `{componentName}.module.scss`
- Update the component type to `{ComponentName}Props`

## Template Structure

The template includes:

- **component.tsx** - Main React component with TypeScript support
- **types.ts** - Component prop types and interfaces
- **component.stories.ts** - Storybook story for the component
- **component.module.scss** - SCSS module styles
- **index.ts** - Public exports
- **package.json** - Package metadata and dependencies (includes Sass and Storybook)
- **tsconfig.json** - TypeScript configuration
- **vitest.config.ts** - Test configuration
- **README.md** - Package documentation

## Implementation Steps

1. Create the directory structure in `/packages/ui/{component-name}/`
2. Copy all template files from `assets/template-empty`
3. Replace component name placeholders:
   - In `package.json`: update name to `@vassembly/ui-{component-name}`
   - In `README.md`: update references to component name
   - Rename `component.tsx` to `{component-name}.tsx`
   - Rename `component.module.scss` to `{component-name}.module.scss`
   - Rename `component.stories.ts` to `{component-name}.stories.ts`
4. Update export statements in `index.ts` to reflect new file names
5. Update story title in the Storybook story file to match component name
6. Confirm successful creation
