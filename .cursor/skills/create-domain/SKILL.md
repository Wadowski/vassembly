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
4. If user includes domain model fields add them to model with relevant type-graphql type decorator
5. Copying the domain-empty template to the domains directory
6. Updating package.json of a coppied template with the correct domain name

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
