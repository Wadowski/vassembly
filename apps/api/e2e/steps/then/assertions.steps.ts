import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import * as bddFixtures from '../../../../../packages/e2e/src/fixtures/bddTest';

import { getNestedValue, resolveItemsArray } from '../utils/nestedValue';
import type { ApiBddWorld } from '../utils/types';

const { bddTest } = bddFixtures;
const { Then } = createBdd(bddTest);

Then('the response contains {string} with value {string}', async ({ world }, field: string, value: string) => {
  const body = (world as ApiBddWorld).lastResponseBody;
  const fieldValue = getNestedValue({ source: body, path: field });
  expect(fieldValue).toBe(value);
});

Then('the response contains {string}', async ({ world }, field: string) => {
  const body = (world as ApiBddWorld).lastResponseBody;
  const fieldValue = getNestedValue({ source: body, path: field });
  expect(fieldValue).toBeDefined();
});

Then('the response contains {string} with text {string}', async ({ world }, field: string, text: string) => {
  const body = (world as ApiBddWorld).lastResponseBody;
  const fieldValue = getNestedValue({ source: body, path: field });
  expect(String(fieldValue)).toContain(text);
});

Then(
  'the response contains {int} items in {string}',
  async ({ world }, count: number, path: string) => {
    const apiWorld = world as ApiBddWorld;
    const items = resolveItemsArray({ source: apiWorld.lastResponseBody, path });
    apiWorld.lastItems = items;
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(count);
  },
);

Then('one item has {string} = {string}', async ({ world }, field: string, value: string) => {
  const apiWorld = world as ApiBddWorld;
  const items = apiWorld.lastItems ?? [];

  const hasMatch = items.some((item) => {
    const fieldValue = getNestedValue({ source: item, path: field });
    return fieldValue === value;
  });

  expect(hasMatch).toBe(true);
});

Then('the response contains {string} = {string}', async ({ world }, path: string, value: string) => {
  const body = (world as ApiBddWorld).lastResponseBody;
  const fieldValue = getNestedValue({ source: body, path });
  expect(fieldValue).toBe(value);
});
