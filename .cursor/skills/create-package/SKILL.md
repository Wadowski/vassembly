---
name: create-package
description: Create a new monorepo pacakge from a template
---

# Create Package Skill

This skill automates the creation of new packages in the monorepo by scaffolding from templates.

## Functionality

The skill handles:
1. Prompting for package type (supported types: "empty") if not provided
2. Prompting for package name if not provided
3. Copying the appropriate template to the packages directory
4. Updating package.json of a coppied template with the correct package name

## Usage

When invoked, the skill will:
- Ask for package type (required, default: empty)
- Ask for package name (required)
- Ask for package direction (required, options: apps, packages, modules)
- Create the package in `/{package-direction}/{package-name}/`
- Update the package name in `package.json` to `@vassembly/{package-name}`
- Update the package name in `README.md` to `@vassembly/{package-name}`

## Implementation

The skill is implemented as a Node.js script that:
1. Prompts the user interactively
2. Validates inputs
3. Copies template files recursively
4. Modifies package.json metadata

