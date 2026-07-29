import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  getAgentResponseCard,
  getCommentSkillTags,
  getPlanDetails,
  getPlanRow,
  TASK_DETAIL_SKILLS_USED_TEST_ID,
  waitForTaskActivityFeed,
} from '../utils/taskPlanPage';
import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

Then(
  'a distinct plan entry appears in the task activity feed separate from the agent response',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    await waitForTaskActivityFeed({ page });
    await expect(getPlanRow({ page, commentId: webWorld.commentId })).toBeVisible();
    await expect(getAgentResponseCard({ page, commentId: webWorld.commentId })).not.toBeVisible();
  },
);

Then(
  'I see plan step groups with per-item status for the ordered plan items',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const details = getPlanDetails({ page, commentId: webWorld.commentId });
    await expect(details).toBeVisible();

    for (const [index, description] of (webWorld.planItemDescriptions ?? []).entries()) {
      await expect(page.getByTestId(`activity-plan-item-${webWorld.commentId}-${index}`)).toBeVisible();
      await expect(details.getByText(description, { exact: false })).toBeVisible();
    }
  },
);

Then(
  'skill tags {string} and {string} are shown on that comment in the activity feed',
  async ({ page, world }, firstSkill: string, secondSkill: string) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const skillTags = getCommentSkillTags({ page, commentId: webWorld.commentId });
    await expect(skillTags).toBeVisible();
    await expect(skillTags.getByText(firstSkill, { exact: true })).toBeVisible();
    await expect(skillTags.getByText(secondSkill, { exact: true })).toBeVisible();
  },
);

Then(
  'the task detail aggregated skills section shows deduplicated skill tags {string}, {string}, and {string}',
  async ({ page }, first: string, second: string, third: string) => {
    if (!page) {
      return;
    }

    const section = page.getByTestId(TASK_DETAIL_SKILLS_USED_TEST_ID);
    await expect(section).toBeVisible();
    await expect(section.getByText(first, { exact: true })).toBeVisible();
    await expect(section.getByText(second, { exact: true })).toBeVisible();
    await expect(section.getByText(third, { exact: true })).toBeVisible();
  },
);

Then(
  'the aggregated skills display matches the specializations aggregation pattern',
  async ({ page }) => {
    if (!page) {
      return;
    }

    const section = page.getByTestId(TASK_DETAIL_SKILLS_USED_TEST_ID);
    await expect(section.getByRole('heading', { name: 'Skills used' })).toBeVisible();
    await expect(page.getByLabel('Linked specializations')).toBeVisible();
  },
);

Then(
  'skill tags on the comment and aggregated task view are plain non-clickable labels',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId) {
      return;
    }

    const regions = [
      getCommentSkillTags({ page, commentId: webWorld.commentId }),
      page.getByTestId(TASK_DETAIL_SKILLS_USED_TEST_ID),
    ];

    for (const region of regions) {
      await expect(region).toBeVisible();
      await expect(region.locator('a')).toHaveCount(0);
    }
  },
);

Then(
  'each skill tag on the comment and aggregated task view links to that skill\'s detail page',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId || !webWorld.specializationId) {
      return;
    }

    const skillId = webWorld.skillIds?.['contract-review'];
    if (!skillId) {
      throw new Error('contract-review skillId is required on world');
    }

    const expectedHref = `/specialization/${webWorld.specializationId}/skills/${skillId}`;
    const regions = [
      getCommentSkillTags({ page, commentId: webWorld.commentId }),
      page.getByTestId(TASK_DETAIL_SKILLS_USED_TEST_ID),
    ];

    for (const region of regions) {
      const link = region.locator(`a[href="${expectedHref}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('aria-label', 'View skill: contract-review');
    }
  },
);

Then(
  'the plan entry renders as a separate task activity feed item linked to the plan instance',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId || !webWorld.taskPlanInstanceId) {
      return;
    }

    const planRow = getPlanRow({ page, commentId: webWorld.commentId });
    await expect(planRow).toBeVisible();
    if (webWorld.planShortName) {
      await expect(planRow).toContainText(webWorld.planShortName);
    }
  },
);

Then(
  'the agent response renders as the existing markdown feed item with the post-work user-facing result',
  async ({ page, world }) => {
    const webWorld = world as WebBddWorld;
    if (!page || !webWorld.commentId || !webWorld.agentResponseText) {
      return;
    }

    const agentResponse = getAgentResponseCard({ page, commentId: webWorld.commentId });
    await expect(agentResponse).toBeVisible();
    await expect(
      page.getByTestId(`activity-agent-response-body-${webWorld.commentId}`),
    ).toContainText(webWorld.agentResponseText);
  },
);

Then('the agent response does not contain the structured plan text', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.commentId) {
    return;
  }

  const body = page.getByTestId(`activity-agent-response-body-${webWorld.commentId}`);
  for (const description of webWorld.planItemDescriptions ?? []) {
    await expect(body).not.toContainText(description);
  }
});

Then('the plan entry and agent response both remain visible', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.commentId) {
    return;
  }

  await expect(getPlanRow({ page, commentId: webWorld.commentId })).toBeVisible();
  await expect(getAgentResponseCard({ page, commentId: webWorld.commentId })).toBeVisible();
});
