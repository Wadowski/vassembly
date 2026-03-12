---
name: create-module
description: Create a new monorepo pacakge from a template in modules folder
---

# Create Module Skill

This skill automates the creation of new module in the monorepo by scaffolding from template

## Functionality

The skill handles:
1. Prompting for module name if not provided
2. Prompting for commands if not provided
3. Prompting for queries if not provided
4. Prompting for clients if not provided
4. If user includes module model fields add them to model with relevant type-graphql type decorator
5. Copying the module-empty template to the modules directory
6. Updating package.json of a coppied template with the correct module name

## Usage

### Create general files

When invoked, the skill will:
- Ask for module name (required)
- Create the module in `/modules/{module-name}/`
- Update the module name in `package.json` to `@vassembly/{module-name}`
- Update the module name in `README.md` to `@vassembly/{module-name}`
- Ask for commands to add, provide list of possible options (required, options: check for possible commands in @vassembly/commands package)
- Ask for queries to add, provide list of possible options (required, options: check for possible queries in @vassembly/queries package)
- Copy relevant commands based on selected options. Use module name in pascal case instead of "module" text
- Copy relevant queries based on selected options. Use module name in pascal case instead of "module" text
- In model and factories use module name instead of "module" text
- Ask if model will have translations. If yes use ModelWithTranslations and keep translationFactory.
- In clients use module name instead of "module" e.g. use module name in plural format for collection name in mongodb client
