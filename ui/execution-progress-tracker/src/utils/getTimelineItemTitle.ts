import { getProgressEventTitle } from './getProgressEventTitle';

import type { TimelineItem } from '../types';

export const getTimelineItemAuthor = (item: TimelineItem): string => {
  if (item.kind === 'question-asked') {
    return 'Assistant';
  }

  if (item.kind === 'answer-submitted') {
    return 'You';
  }

  return item.progressEvent?.agentName ?? 'Agent';
};

export const getTimelineItemNodeState = (
  item: TimelineItem,
): 'STARTED' | 'COMPLETED' | 'FAILED' | 'WAITING' | 'QUESTION_ASKED' | 'ANSWER_SUBMITTED' => {
  if (item.kind === 'question-asked') {
    return 'QUESTION_ASKED';
  }

  if (item.kind === 'answer-submitted') {
    return 'ANSWER_SUBMITTED';
  }

  return item.progressEvent?.state ?? 'STARTED';
};

export const getTimelineItemHeading = (item: TimelineItem): string => {
  if (item.kind === 'question-asked') {
    return 'Question asked';
  }

  if (item.kind === 'answer-submitted') {
    return 'Answer submitted';
  }

  if (item.progressEvent !== undefined) {
    return getProgressEventTitle(item.progressEvent);
  }

  return 'Progress event';
};

export const getTimelineItemDetail = (item: TimelineItem): string | undefined => {
  if (item.kind === 'question-asked') {
    return item.questionData?.question;
  }

  if (item.kind === 'answer-submitted') {
    return item.questionData?.answer;
  }

  return undefined;
};
