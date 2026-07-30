import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  rememberSpecializationId,
  seedBareSpecialization,
  seedClassifierProgressEvent,
  seedClassifierTurnProgressEvents,
  seedCommentWithSpecializations,
  seedMultiSpecPlanComment,
  seedSpecializationWithWorkerAgents,
  seedTaskCommentAwaitingClassification,
  ensureMcpCatalogIncludesNotion,
  specializationExistsInCatalog,
} from '../utils/seedMultiSpecTask';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const normalizeSpecializationKey = (name: string): string => name.trim().toLowerCase();

Given('I submit {string}', async ({ seed, world }, userText: string) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before submitting a comment');
  }

  const seeded = await seedTaskCommentAwaitingClassification({
    context: seed,
    userId: webWorld.auth.userId,
    userText,
    taskId: webWorld.taskId,
  });

  webWorld.taskId = seeded.taskId;
  webWorld.commentId = seeded.commentId;
  webWorld.commentText = userText;
});

Given('a {string} specialization already exists', async ({ seed, world }, name: string) => {
  const webWorld = world as WebBddWorld;
  const specializationId = await seedSpecializationWithWorkerAgents({ context: seed, name });
  webWorld.specializationIds = rememberSpecializationId({
    store: webWorld.specializationIds ?? {},
    name,
    specializationId,
  });
});

Given('no specialization exists for {string}', async ({ seed }, name: string) => {
  const exists = await specializationExistsInCatalog({ context: seed, name });
  if (exists) {
    throw new Error(`Expected specialization "${name}" to be absent from the catalog`);
  }
});

Given(
  'a comment has specializationIds {string} and {string}',
  async ({ seed, world }, firstName: string, secondName: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding a multi-spec comment');
    }

    const seeded = await seedCommentWithSpecializations({
      context: seed,
      userId: webWorld.auth.userId,
      specializationNames: [firstName, secondName],
      userText: `Plan for ${firstName} and ${secondName}`,
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
    webWorld.specializationIds = seeded.specializationIdsByName;
  },
);

Given(
  'a comment has specializationIds [{string}] only',
  async ({ seed, world }, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding a single-spec comment');
    }

    const seeded = await seedCommentWithSpecializations({
      context: seed,
      userId: webWorld.auth.userId,
      specializationNames: [specializationName],
      userText: `Plan for ${specializationName}`,
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
    webWorld.specializationIds = seeded.specializationIdsByName;

    if (normalizeSpecializationKey(specializationName) === 'slack') {
      webWorld.planWorkerItems = [
        {
          agentName: 'Slack worker',
          order: 1,
          description: "Post today's release notes to the team Slack channel",
        },
      ];
    }
  },
);

Given(
  'I submit a comment requiring both legal review and an Airtable update',
  async ({ seed, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before submitting a comment');
    }

    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: 'Review the vendor contract for legal risk and update our Airtable tracker',
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
  },
);

Given(
  "a comment's raw classifier output contains more than {int} valid specialization lines\\/NEW entries",
  async ({ seed, world }, _minimumCount: number) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding classifier output');
    }

    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: 'Coordinate six distinct domains for the launch',
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
  },
);

Given(
  'the {string} worker step produces the list of 20 popular meals',
  async ({ world }, workerLabel: string) => {
    const webWorld = world as WebBddWorld;
    webWorld.planWorkerItems = [
      ...(webWorld.planWorkerItems ?? []),
      {
        agentName: toWorkerAgentName(workerLabel),
        order: 1,
        description: 'Research and compile the 20 most popular meals with a brief summary of each',
      },
    ];
  },
);

Given(
  'the {string} worker step creates a Notion page from that list',
  async ({ world }, workerLabel: string) => {
    const webWorld = world as WebBddWorld;
    webWorld.planWorkerItems = [
      ...(webWorld.planWorkerItems ?? []),
      {
        agentName: toWorkerAgentName(workerLabel),
        order: 2,
        description:
          'Create a Notion page containing the summary of the 20 most popular meals produced in the prior step',
      },
    ];
  },
);

Given(
  'neither specialization\'s output is required as input to the other',
  async ({ world }) => {
    const webWorld = world as WebBddWorld;
    webWorld.planWorkerItems = [
      {
        agentName: 'Engineering worker',
        order: 1,
        description: 'Complete engineering deliverables for the request',
      },
      {
        agentName: 'Finance worker',
        order: 1,
        description: 'Complete finance deliverables for the request',
      },
    ];
  },
);

Given('my comment triggers Specialization Classifier invocation', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
    throw new Error('taskId and commentId are required before seeding classifier invocation');
  }

  webWorld.classifierEventId = await seedClassifierProgressEvent({
    context: seed,
    userId: webWorld.auth.userId,
    taskId: webWorld.taskId,
    commentId: webWorld.commentId,
    params: {
      state: 'completed',
      inputMessages: JSON.stringify({ prompt: webWorld.commentText ?? 'E2E classification input' }),
      generatedResponse: 'food & nutrition\nnotion',
      outcomeSummary: 'Matched: food & nutrition · Matched: notion',
      durationMs: 3_200,
      tokenUsage: { input: 180, output: 24, total: 204 },
    },
  });
});

Given(
  'the Specialization Classifier is invoked using a platform-scoped credential',
  async ({ seed, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId || !webWorld.taskId || !webWorld.commentId) {
      throw new Error('taskId and commentId are required before seeding classifier invocation');
    }

    webWorld.classifierEventId = await seedClassifierProgressEvent({
      context: seed,
      userId: webWorld.auth.userId,
      taskId: webWorld.taskId,
      commentId: webWorld.commentId,
      params: {
        state: 'completed',
        outcomeSummary: 'Matched: legal',
      },
    });
  },
);

Given('my comment\'s description is too short to classify', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a short comment');
  }

  const seeded = await seedTaskCommentAwaitingClassification({
    context: seed,
    userId: webWorld.auth.userId,
    userText: 'Hi',
  });

  webWorld.taskId = seeded.taskId;
  webWorld.commentId = seeded.commentId;
  webWorld.commentText = 'Hi';

  webWorld.classifierEventId = await seedClassifierProgressEvent({
    context: seed,
    userId: webWorld.auth.userId,
    taskId: seeded.taskId,
    commentId: seeded.commentId,
    params: {
      state: 'skipped',
      outcomeSummary: 'Skipped: short_description',
    },
  });
});

Given(
  'my comment causes a new {string} specialization to be created',
  async ({ seed, world }, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding classifier outcome');
    }

    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: `Update our ${specializationName} workspace records`,
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;

    webWorld.classifierEventId = await seedClassifierProgressEvent({
      context: seed,
      userId: webWorld.auth.userId,
      taskId: seeded.taskId,
      commentId: seeded.commentId,
      params: {
        state: 'completed',
        outcomeSummary: `Created: ${specializationName}`,
      },
    });
  },
);

Given(
  'my comment triggers classification followed by researcher, Task Planner, worker, and validator invocations',
  async ({ seed, world }) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding classifier turn events');
    }

    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: 'Create a summary in my Notion about the 20 most popular meals',
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;

    await seedClassifierTurnProgressEvents({
      context: seed,
      userId: webWorld.auth.userId,
      taskId: seeded.taskId,
      commentId: seeded.commentId,
      params: {
        classifier: {
          state: 'completed',
          outcomeSummary: 'Matched: food & nutrition · Matched: notion',
        },
        downstreamAgentNames: [
          'Food & nutrition researcher',
          'Task Planner',
          'Food & nutrition worker',
          'Food & nutrition validator',
        ],
      },
    });
  },
);

Given(
  'the MCP catalog includes an MCP named {string} with a short description',
  async ({ seed }, _mcpName: string) => {
    await ensureMcpCatalogIncludesNotion({ context: seed });
  },
);

Given('a {string} specialization already exists for mixed classification', async ({ seed, world }, name: string) => {
  const webWorld = world as WebBddWorld;
  const specializationId = await seedBareSpecialization({ context: seed, name });
  webWorld.specializationIds = rememberSpecializationId({
    store: webWorld.specializationIds ?? {},
    name,
    specializationId,
  });
});

Given('a comment genuinely spans 5 distinct domains', async ({ seed, world }) => {
  const webWorld = world as WebBddWorld;
  if (!webWorld.auth?.userId) {
    throw new Error('User must be logged in before seeding a multi-domain comment');
  }

  const seeded = await seedTaskCommentAwaitingClassification({
    context: seed,
    userId: webWorld.auth.userId,
    userText:
      'Coordinate legal, finance, engineering, marketing, and operations work for the product launch',
  });

  webWorld.taskId = seeded.taskId;
  webWorld.commentId = seeded.commentId;
});

Given(
  'a comment requires both {string} work and {string} work with no shared platform dependency',
  async ({ seed, world }, firstDomain: string, secondDomain: string) => {
    const webWorld = world as WebBddWorld;
    if (!webWorld.auth?.userId) {
      throw new Error('User must be logged in before seeding a cross-domain comment');
    }

    await seedSpecializationWithWorkerAgents({ context: seed, name: firstDomain });
    await seedSpecializationWithWorkerAgents({ context: seed, name: secondDomain });

    const seeded = await seedTaskCommentAwaitingClassification({
      context: seed,
      userId: webWorld.auth.userId,
      userText: `Prepare ${firstDomain} analysis and ${secondDomain} reporting for leadership`,
    });

    webWorld.taskId = seeded.taskId;
    webWorld.commentId = seeded.commentId;
  },
);

const capitalizeWords = (value: string): string => {
  const normalized = normalizeSpecializationKey(value);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const toWorkerAgentName = (workerLabel: string): string => {
  const trimmed = workerLabel.trim();
  if (trimmed.toLowerCase().endsWith(' worker')) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  return `${capitalizeWords(trimmed)} worker`;
};
