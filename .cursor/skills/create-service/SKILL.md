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
5. Copying the service-empty template to the services directory
6. Updating package.json of a coppied template with the correct service name

## Usage

### Create general files

When invoked, the skill will:
- Ask for service name (required)
- Create the service in `/services/{service-name}/`
- Update the service name in `package.json` to `@vassembly/{service-name}`
- Update the service name in `README.md` to `@vassembly/{service-name}`
- Ask for domains to add, provide list of possible options (required, options: check for possible domains in domains folder)
- add selected domains to dependencies in package.json
