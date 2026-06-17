import { mongoDb } from '@vassembly/client-mongodb';
import { InternalError } from '@vassembly/errors';

import { taskQuestionsFactory } from '../model/factories';

import type {
  AnsweredQuestion,
  BlockedInvocation,
  PendingQuestion,
  TaskQuestionsModel,
} from '../model/model';

export const TASK_QUESTIONS_COLLECTION_NAME = 'taskQuestions';

interface TaskQuestionsDocument {
  _id: unknown;
  taskId: string;
  pendingQuestions: PendingQuestion[];
  answeredQuestions: AnsweredQuestion[];
  blockedInvocations: BlockedInvocation[];
  createdAt: Date;
  updatedAt: Date;
}

const getCollection = () =>
  mongoDb.db.collection<TaskQuestionsDocument>(TASK_QUESTIONS_COLLECTION_NAME);

const mapDocumentToModel = (document: TaskQuestionsDocument): TaskQuestionsModel => {
  return taskQuestionsFactory.create({
    ...document,
    id: (document._id as { toString: () => string }).toString(),
  });
};

export interface FindByTaskIdParams {
  taskId: string;
}

export interface RecordQuestionsParams {
  taskId: string;
  pendingQuestions: PendingQuestion[];
  blockedInvocation: BlockedInvocation;
}

export interface SubmitAnswerParams {
  taskId: string;
  questionId: string;
  answeredQuestion: AnsweredQuestion;
}

export interface ClearBlockedInvocationsParams {
  taskId: string;
}

export interface DeleteByTaskIdParams {
  taskId: string;
}

const findByTaskId = async ({ taskId }: FindByTaskIdParams): Promise<TaskQuestionsModel | null> => {
  const collection = getCollection();
  const document = await collection.findOne({ taskId });

  if (!document) {
    return null;
  }

  return mapDocumentToModel(document);
};

const recordQuestions = async ({
  taskId,
  pendingQuestions,
  blockedInvocation,
}: RecordQuestionsParams): Promise<TaskQuestionsModel> => {
  const collection = getCollection();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    { taskId },
    {
      $setOnInsert: {
        taskId,
        answeredQuestions: [],
        createdAt: now,
      },
      $push: {
        pendingQuestions: { $each: pendingQuestions },
      },
      $set: {
        updatedAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const document = result ?? (await collection.findOne({ taskId }));

  if (!document) {
    throw new InternalError('Failed to record questions');
  }

  const existingBlocked = document.blockedInvocations ?? [];
  const hasInvocation = existingBlocked.some(
    (entry) => entry.invocationId === blockedInvocation.invocationId,
  );
  const blockedInvocations = hasInvocation
    ? existingBlocked
    : [...existingBlocked, blockedInvocation];

  const updated = await collection.findOneAndUpdate(
    { taskId },
    {
      $set: {
        blockedInvocations,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!updated) {
    throw new InternalError('Failed to update blocked invocations');
  }

  return mapDocumentToModel(updated);
};

const submitAnswer = async ({
  taskId,
  questionId,
  answeredQuestion,
}: SubmitAnswerParams): Promise<TaskQuestionsModel | null> => {
  const collection = getCollection();

  const result = await collection.findOneAndUpdate(
    {
      taskId,
      'pendingQuestions.questionId': questionId,
    },
    {
      $pull: { pendingQuestions: { questionId } },
      $push: { answeredQuestions: answeredQuestion },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' },
  );

  if (!result) {
    return null;
  }

  return mapDocumentToModel(result);
};

const clearBlockedInvocations = async ({
  taskId,
}: ClearBlockedInvocationsParams): Promise<TaskQuestionsModel | null> => {
  const collection = getCollection();

  const result = await collection.findOneAndUpdate(
    { taskId },
    {
      $set: {
        blockedInvocations: [],
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!result) {
    return null;
  }

  return mapDocumentToModel(result);
};

const deleteByTaskId = async ({ taskId }: DeleteByTaskIdParams): Promise<boolean> => {
  const collection = getCollection();
  const result = await collection.deleteOne({ taskId });
  return result.deletedCount === 1;
};

export const taskQuestionsMongodbDao = {
  findByTaskId,
  recordQuestions,
  submitAnswer,
  clearBlockedInvocations,
  deleteByTaskId,
};

export const mongodbIndexes = async (): Promise<void> => {
  const collection = getCollection();
  await collection.createIndex({ taskId: 1 }, { unique: true, name: 'idx_taskId_unique' });
};
