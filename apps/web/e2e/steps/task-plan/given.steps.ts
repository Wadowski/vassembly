import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { seedTaskPlanComment, seedTaskWithCommentSkills } from '../utils/seedTaskPlan';
import type { TaskPlanSeedItem } from '../utils/taskPlanTypes';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const parsePlanItemsTable = (table: { rows: () => string[][] }): TaskPlanSeedItem[] => {
  const [header, ...rows] = table.rows();
  const columnIndex = Object.fromEntries(header.map((column, index) => [column.trim(), index]));

  return rows.map((row) => ({
    order: Number(row[columnIndex.order]),
    agentName: row[columnIndex.agentName],
    skillName: row[columnIndex.skillName]?.trim() ? row[columnIndex.skillName].trim() : null,
    description: row[columnIndex.description],
    status: row[columnIndex.status] as TaskPlanSeedItem['status'],
  }));
};

Given(
  'a task comment has an associated task plan instance with items:',
  async ({ seed, world }, table) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding a task plan');
    }

    const items = parsePlanItemsTable(table);
    const seeded = await seedTaskPlanComment({
      context: seed,
      userId: webWorld.auth.userId,
      params: {
        shortName: webWorld.planShortName ?? 'contract-risk-review',
        items,
        skillNames: items
          .map((item) => item.skillName)
          .filter((skillName): skillName is string => skillName !== null),
      },
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
    webWorld.taskPlanInstanceId = seeded.taskPlanInstanceId;
    webWorld.specializationId = seeded.specializationId;
    webWorld.skillIds = seeded.skillIdsByName;
    webWorld.planItemDescriptions = items.map((item) => item.description);
  },
);

Given('the plan short name is {string}', async ({ world }, shortName: string) => {
  (world as WebBddWorld).planShortName = shortName;
});

Given('a task comment uses skill {string}', async ({ seed, world }, skillName: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding comment skills');
  }

  const seeded = await seedTaskPlanComment({
    context: seed,
    userId: webWorld.auth.userId,
    params: {
      shortName: 'comment-skill-plan',
      items: [
        {
          order: 1,
          agentName: 'Legal researcher',
          skillName,
          description: 'Execute seeded skill for comment tags',
          status: 'done',
        },
      ],
      skillNames: [skillName],
    },
  });

  webWorld.taskId = seeded.taskId;
  webWorld.commentId = seeded.commentId;
  webWorld.specializationId = seeded.specializationId;
  webWorld.skillIds = seeded.skillIdsByName;
});

Given(
  'a task comment uses skills {string} and {string}',
  async ({ seed, world }, firstSkill: string, secondSkill: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding comment skills');
    }

    const seeded = await seedTaskPlanComment({
      context: seed,
      userId: webWorld.auth.userId,
      params: {
        shortName: 'comment-skills-plan',
        items: [
          {
            order: 1,
            agentName: 'Legal researcher',
            skillName: firstSkill,
            description: 'Execute seeded skills for comment tags',
            status: 'done',
          },
        ],
        skillNames: [firstSkill, secondSkill],
      },
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
    webWorld.specializationId = seeded.specializationId;
    webWorld.skillIds = seeded.skillIdsByName;
  },
);

Given('a task has comments using skills:', async ({ seed, world }, table) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding comment skills');
  }

  const [header, ...rows] = table.rows();
  const commentIndex = header.indexOf('comment');
  const skillsIndex = header.indexOf('skills');

  const commentSkills = rows.map((row) => ({
    commentKey: row[commentIndex],
    skillNames: row[skillsIndex].split(',').map((skillName) => skillName.trim()).filter(Boolean),
  }));

  const seeded = await seedTaskWithCommentSkills({
    context: seed,
    userId: webWorld.auth.userId,
    commentSkills,
  });

  webWorld.taskId = seeded.taskId;
  webWorld.commentIds = seeded.commentIds;
  webWorld.commentId = seeded.commentIds['1'];
  webWorld.specializationId = seeded.specializationId;
  webWorld.skillIds = seeded.skillIdsByName;
});

Given(
  'a comment execution produced a plan instance and completed with agent response:',
  async ({ seed, world }, table) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding plan vs agent response');
    }

    const [header, ...rows] = table.rows();
    const columnIndex = Object.fromEntries(header.map((column, index) => [column.trim(), index]));
    const row = rows[0];
    const planShortName = row[columnIndex.planShortName];
    const agentResponse = row[columnIndex.agentResponseOutcome];
    const planItemDescription = row[columnIndex.planItemDescription];

    const seeded = await seedTaskPlanComment({
      context: seed,
      userId: webWorld.auth.userId,
      params: {
        shortName: planShortName,
        items: [
          {
            order: 1,
            agentName: 'Legal researcher',
            skillName: null,
            description: planItemDescription,
            status: 'done',
          },
        ],
        skillNames: [],
        agentResponse,
      },
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
    webWorld.taskPlanInstanceId = seeded.taskPlanInstanceId;
    webWorld.planShortName = planShortName;
    webWorld.agentResponseText = agentResponse;
    webWorld.planItemDescriptions = [planItemDescription];
  },
);
