# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/features/mcps/configuration-graphql.feature.spec.js >> MCP Configuration (GraphQL Queries) >> Fetch list of configured MCPs
- Location: .features-gen/e2e/features/mcps/configuration-graphql.feature.spec.js:6:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | import { Then } from '../../fixtures/bddTest';
  4  | 
  5  | Then('I see {string}', async ({ page }, text: string) => {
  6  |   if (!page) {
  7  |     return;
  8  |   }
  9  | 
  10 |   await expect(page.getByText(text)).toBeVisible();
  11 | });
  12 | 
  13 | Then('I do not see {string}', async ({ page }, text: string) => {
  14 |   if (!page) {
  15 |     return;
  16 |   }
  17 | 
  18 |   await expect(page.getByText(text)).not.toBeVisible();
  19 | });
  20 | 
  21 | Then('I see a success message', async ({ page }) => {
  22 |   if (!page) {
  23 |     return;
  24 |   }
  25 | 
  26 |   const successMessage = page.locator('[role="status"], [role="alert"]');
  27 |   await expect(successMessage.first()).toBeVisible();
  28 | });
  29 | 
  30 | Then('the response status is {int}', async ({ world }, status: number) => {
  31 |   if (!world.lastResponse) {
  32 |     throw new Error('No API response stored on world.lastResponse');
  33 |   }
  34 | 
  35 |   expect(world.lastResponse.status()).toBe(status);
  36 | });
  37 | 
     |                                                          ^ Error: expect(received).toBe(expected) // Object.is equality
```