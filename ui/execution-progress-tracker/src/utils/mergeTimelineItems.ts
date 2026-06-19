import type { ProgressAnsweredQuestion, ProgressEvent, TimelineItem } from '../types';

export const mergeTimelineItems = ({
  events,
  answeredQuestions = [],
}: {
  events: ProgressEvent[];
  answeredQuestions?: ProgressAnsweredQuestion[];
}): TimelineItem[] => {
  const progressItems: TimelineItem[] = events.map((event) => ({
    id: event.id,
    kind: 'progress-event',
    timestamp: event.timestamp,
    progressEvent: event,
  }));

  const questionItems: TimelineItem[] = answeredQuestions.flatMap((question) => [
    {
      id: `question-asked-${question.questionId}`,
      kind: 'question-asked' as const,
      timestamp: new Date(question.askedAt),
      questionData: question,
    },
    {
      id: `answer-submitted-${question.questionId}`,
      kind: 'answer-submitted' as const,
      timestamp: new Date(question.answeredAt),
      questionData: question,
    },
  ]);

  return [...progressItems, ...questionItems].sort(
    (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
  );
};
