import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest, requireWorkspaceModule } from '@vassembly/e2e';

import {
  expandClassifierProgressRow,
  getClassifierProgressRow,
  getCommentSpecializationRegion,
  getProgressEventRows,
  waitForTaskActivityFeed,
  CLASSIFIER_AGENT_NAME,
} from '../utils/multiSpecTaskPage';
import {
  getClassifierRuleText,
  getCommentSpecializationIds,
  getSpecializationIdByName,
  specializationExistsInCatalog,
} from '../utils/seedMultiSpecTask';
import { getPlanDetails } from '../utils/taskPlanPage';
import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

Then(
  'the comment\'s specializationIds includes the {string} specialization ID',
  async ({ seed, world }, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.commentId) {
      throw new Error('commentId is required to verify specializationIds');
    }

    const expectedId = await getSpecializationIdByName({ context: seed, name: specializationName });
    if (!expectedId) {
      throw new Error(`Specialization "${specializationName}" was not found in the catalog`);
    }

    const specializationIds = await getCommentSpecializationIds({
      context: seed,
      commentId: webWorld.commentId,
    });

    expect(specializationIds).toContain(expectedId);
  },
);

Then('no third, unrelated specialization is added', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify specializationIds');
  }

  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds).toHaveLength(2);
});

Then('a new {string} specialization is created', async ({ seed }, specializationName: string) => {
  const exists = await specializationExistsInCatalog({ context: seed, name: specializationName });
  expect(exists).toBe(true);
});

Then('neither branch is discarded in favor of the other', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify mixed classification');
  }

  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds.length).toBeGreaterThanOrEqual(2);
});

Then(
  'the classifier\'s context includes the MCP catalog hint for {string}',
  async ({ world }, platformName: string) => {
    const webWorld = world as WebBddWorld;
    const input = webWorld.classifierInputMessage ?? '';

    expect(input.toLowerCase()).toContain(platformName.toLowerCase());
    expect(input.toLowerCase()).toMatch(/available tools|mcp|catalog/);
  },
);

Then(
  'the newly created specialization is named {string}, matching the MCP catalog name',
  async ({ seed }, specializationName: string) => {
    const specializationId = await getSpecializationIdByName({ context: seed, name: specializationName });
    expect(specializationId).not.toBeNull();
  },
);

Then('all {int} specializations are accepted and applied to the comment', async ({ seed, world }, count: number) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify specialization cap');
  }

  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds).toHaveLength(count);
});

Then('only the 5 most central specializations are retained', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify specialization cap');
  }

  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds).toHaveLength(5);
});

Then('the excess entries are not applied to the comment', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify specialization cap');
  }

  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds.length).toBeLessThanOrEqual(5);
});

Then(
  'both {string} and {string} specialization IDs are returned',
  async ({ seed, world }, firstName: string, secondName: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.commentId) {
      throw new Error('commentId is required to verify specializationIds');
    }

    const firstId = await getSpecializationIdByName({ context: seed, name: firstName });
    const secondId = await getSpecializationIdByName({ context: seed, name: secondName });

    const specializationIds = await getCommentSpecializationIds({
      context: seed,
      commentId: webWorld.commentId,
    });

    expect(firstId).not.toBeNull();
    expect(secondId).not.toBeNull();
    expect(specializationIds).toContain(firstId);
    expect(specializationIds).toContain(secondId);
  },
);

Then(
  'the classifier is not instructed anywhere in its rule to minimize the specialization count',
  async ({ seed }) => {
    const ruleText = await getClassifierRuleText({ context: seed });
    expect(ruleText.toLowerCase()).not.toContain('prefer fewer');
  },
);

Then('exactly {int} specialization ID for {string} is returned', async ({ seed, world }, count: number, specializationName: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify specializationIds');
  }

  const expectedId = await getSpecializationIdByName({ context: seed, name: specializationName });
  const specializationIds = await getCommentSpecializationIds({
    context: seed,
    commentId: webWorld.commentId,
  });

  expect(specializationIds).toHaveLength(count);
  expect(specializationIds[0]).toBe(expectedId);
});

Then('the {string} item has order {int}', async ({ page, world }, agentName: string, order: number) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.commentId) {
    return;
  }

  await waitForTaskActivityFeed({ page });
  const stepGroup = page.getByTestId(`activity-plan-step-${webWorld.commentId}-${order}`);
  await expect(stepGroup).toBeVisible();
  await expect(stepGroup.getByText(agentName, { exact: false })).toBeVisible();
});

Then(
  'the {string} item\'s description references consuming the food & nutrition worker\'s output',
  async ({ page, world }, agentName: string) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const details = getPlanDetails({ page, commentId: webWorld.commentId });
    await expect(details).toBeVisible();
    await expect(details.getByText(agentName, { exact: false })).toBeVisible();
    await expect(details.getByText(/prior step|produced in the prior step/i)).toBeVisible();
  },
);

Then(
  'both the {string} and {string} items have the same order value',
  async ({ page, world }, firstAgent: string, secondAgent: string) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const details = getPlanDetails({ page, commentId: webWorld.commentId });
    await expect(details.getByText(firstAgent, { exact: false })).toBeVisible();
    await expect(details.getByText(secondAgent, { exact: false })).toBeVisible();
    await expect(details.getByText('Step 1 (parallel)', { exact: false })).toBeVisible();
  },
);

Then(
  'a classifier entry appears with the agent name {string}',
  async ({ page }, agentName: string) => {
    if (!page) {
      return;
    }

    await waitForTaskActivityFeed({ page });
    await expect(page.getByText(agentName, { exact: true })).toBeVisible();
  },
);

Then(
  'the entry shows the input message, the raw output, duration, and token usage \\(when available\\)',
  async ({ page }) => {
    if (!page) {
      return;
    }

    await expandClassifierProgressRow({ page });
    const details = page.locator('[data-testid^="activity-progress-details-"]').first();
    await expect(details.getByText('Input', { exact: true })).toBeVisible();
    await expect(details.getByText('Response', { exact: true })).toBeVisible();
    await expect(details.locator('[data-testid^="activity-progress-event-stats-"]').first()).toBeVisible();
  },
);

Then(
  'the entry shows the parsed outcome: matched existing specialization names and\\/or newly created specialization names',
  async ({ page }) => {
    if (!page) {
      return;
    }

    await expandClassifierProgressRow({ page });
    const details = page.locator('[data-testid^="activity-progress-details-"]').first();
    await expect(details.getByText(/Matched:|Created:/)).toBeVisible();
  },
);

Then('a progress event for this invocation is recorded for the comment', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.commentId) {
    throw new Error('commentId is required to verify progress events');
  }

  const taskProgressDomain = requireWorkspaceModule<typeof import('@vassembly/domain-task-progress')>({
    moduleName: '@vassembly/domain-task-progress',
  });
  const systemAgentDomain = requireWorkspaceModule<typeof import('@vassembly/domain-system-agent')>({
    moduleName: '@vassembly/domain-system-agent',
  });

  const progress = await taskProgressDomain.default.queries.getModelByCommentId({
    commentId: webWorld.commentId,
  });

  const classifierAgent = await systemAgentDomain.default.queries.getActiveByName({
    name: CLASSIFIER_AGENT_NAME,
  });
  const classifierAgentId = classifierAgent.data.id;

  const classifierEvents = (progress.data?.events ?? []).filter(
    (event) => event.agentId === classifierAgentId,
  );

  expect(classifierEvents.length).toBeGreaterThan(0);
});

Then(
  'the activity feed renders the classifier entry exactly as it would for a user-credentialed invocation',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.taskId) {
      return;
    }

    await page.goto(`/tasks/${webWorld.taskId}`);
    await waitForTaskActivityFeed({ page });
    await expect(getClassifierProgressRow({ page })).toBeVisible();
    await expandClassifierProgressRow({ page });
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  },
);

Then(
  'the activity feed shows a classifier entry with status {string}',
  async ({ page, world }, status: string) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.taskId) {
      return;
    }

    await page.goto(`/tasks/${webWorld.taskId}`);
    await waitForTaskActivityFeed({ page });
    const row = getClassifierProgressRow({ page });
    await expect(row).toBeVisible();
    await expect(row).toContainText(status, { ignoreCase: true });
  },
);

Then('the entry shows the skip reason for example {string}', async ({ page }, reason: string) => {
  if (!page) {
    return;
  }

  await expandClassifierProgressRow({ page });
  const details = page.locator('[data-testid^="activity-progress-details-"]').first();
  await expect(details.getByText(new RegExp(reason, 'i'))).toBeVisible();
});

Then(
  'the entry indicates a new specialization {string} was created as an outcome of this classification',
  async ({ page }, specializationName: string) => {
    if (!page) {
      return;
    }

    await expandClassifierProgressRow({ page });
    const details = page.locator('[data-testid^="activity-progress-details-"]').first();
    await expect(details.getByText(new RegExp(`Created:.*${specializationName}`, 'i'))).toBeVisible();
  },
);

Then(
  'the classifier entry\'s timestamp is earlier than the researcher entries\' timestamps',
  async ({ page }) => {
    if (!page) {
      return;
    }

    await waitForTaskActivityFeed({ page });
    const classifierRow = getClassifierProgressRow({ page });
    const researcherRow = page.getByRole('button', { name: /researcher/i }).first();

    await expect(classifierRow).toBeVisible();
    await expect(researcherRow).toBeVisible();

    const classifierBox = await classifierRow.boundingBox();
    const researcherBox = await researcherRow.boundingBox();

    if (!classifierBox || !researcherBox) {
      throw new Error('Unable to resolve classifier/researcher row positions');
    }

    expect(classifierBox.y).toBeGreaterThan(researcherBox.y);
  },
);

Then(
  'the classifier entry renders above the researcher\\/Task Planner\\/worker\\/validator entries in the feed',
  async ({ page }) => {
    if (!page) {
      return;
    }

    const rows = getProgressEventRows({ page });
    const texts = await rows.allTextContents();
    const classifierIndex = texts.findIndex((text) => text.includes(CLASSIFIER_AGENT_NAME));
    const downstreamIndex = texts.findIndex((text) =>
      /researcher|task planner|worker|validator/i.test(text),
    );

    expect(classifierIndex).toBeGreaterThanOrEqual(0);
    expect(downstreamIndex).toBeGreaterThanOrEqual(0);
    expect(classifierIndex).toBeLessThan(downstreamIndex);
  },
);

Then(
  'specialization tags {string} and {string} are shown on that comment in the activity feed',
  async ({ page, world }, firstName: string, secondName: string) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const region = getCommentSpecializationRegion({ page, commentId: webWorld.commentId });
    await expect(region).toBeVisible();
    await expect(region.getByText(firstName, { exact: false })).toBeVisible();
    await expect(region.getByText(secondName, { exact: false })).toBeVisible();
  },
);
