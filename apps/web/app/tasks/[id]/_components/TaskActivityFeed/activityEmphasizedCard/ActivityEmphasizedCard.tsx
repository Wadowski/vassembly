'use client';

import { useState } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';

import { MarkdownContent } from '../../TaskDetailAiResponse/MarkdownContent';
import { ExpandableText } from '../expandableText/ExpandableText';
import { ACTIVITY_TEXT_SHOW_MORE_THRESHOLD_CHARS } from '../expandableText/constants';
import { formatExecutionStats } from '../formatExecutionStats';
import styles from './ActivityEmphasizedCard.module.scss';

export type ActivityEmphasizedCardVariant = 'user' | 'agent' | 'hitl';

export interface ActivityEmphasizedCardProps {
  label: string;
  testId: string;
  variant: ActivityEmphasizedCardVariant;
  children: React.ReactNode;
}

const variantClassName: Record<ActivityEmphasizedCardVariant, string> = {
  user: styles.cardUser,
  agent: styles.cardAgent,
  hitl: styles.cardHitl,
};

export const ActivityEmphasizedCard = ({
  label,
  testId,
  variant,
  children,
}: ActivityEmphasizedCardProps): JSX.Element => {
  return (
    <li
      className={`${styles.card} ${variantClassName[variant]}`}
      data-testid={testId}
    >
      <Text variant="label" className={styles.label}>
        {label}
      </Text>
      <div className={styles.body}>{children}</div>
    </li>
  );
};

export interface ActivityUserCommentProps {
  commentId: string;
  userText: string;
}

export const ActivityUserComment = ({
  commentId,
  userText,
}: ActivityUserCommentProps): JSX.Element => {
  return (
    <ActivityEmphasizedCard
      label="You"
      variant="user"
      testId={`activity-user-comment-${commentId}`}
    >
      <ExpandableText text={userText} testId={`activity-user-comment-text-${commentId}`} />
    </ActivityEmphasizedCard>
  );
};

export interface ActivityAgentResponseProps {
  commentId: string;
  agentResponse: string;
  totalDuration?: number | null;
  totalTokens?: { input: number; output: number; total: number } | null;
}

export const ActivityAgentResponse = ({
  commentId,
  agentResponse,
  totalDuration,
  totalTokens,
}: ActivityAgentResponseProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = agentResponse.length > ACTIVITY_TEXT_SHOW_MORE_THRESHOLD_CHARS;
  const markdownClassName = isExpanded ? styles.markdown : `${styles.markdown} ${styles.markdownClamped}`;
  const statsLabel = formatExecutionStats({
    durationMs: totalDuration,
    tokenUsage: totalTokens,
  });

  return (
    <ActivityEmphasizedCard
      label="Agent"
      variant="agent"
      testId={`activity-agent-response-${commentId}`}
    >
      {statsLabel ? (
        <Text
          variant="caption"
          className={styles.stats}
          data-testid={`activity-agent-response-stats-${commentId}`}
        >
          {statsLabel}
        </Text>
      ) : null}
      <div className={markdownClassName}>
        <MarkdownContent
          content={agentResponse}
          testId={`activity-agent-response-body-${commentId}`}
        />
      </div>
      {canExpand ? (
        <Button
          variant="text"
          color="primary"
          text={isExpanded ? 'Show less' : 'Show more'}
          onClick={() => {
            setIsExpanded((current) => !current);
          }}
          data-testid={`activity-agent-response-toggle-${commentId}`}
        />
      ) : null}
    </ActivityEmphasizedCard>
  );
};

export interface ActivityHitlAnsweredProps {
  questionId: string;
  question: string;
  answer: string;
}

export const ActivityHitlAnswered = ({
  questionId,
  question,
  answer,
}: ActivityHitlAnsweredProps): JSX.Element => {
  return (
    <ActivityEmphasizedCard
      label="Question & answer"
      variant="hitl"
      testId={`activity-hitl-${questionId}`}
    >
      <Text variant="body2" className={styles.questionLabel}>
        Question
      </Text>
      <ExpandableText text={question} testId={`activity-hitl-question-${questionId}`} />
      <Text variant="body2" className={styles.questionLabel}>
        Your answer
      </Text>
      <ExpandableText text={answer} testId={`activity-hitl-answer-${questionId}`} />
    </ActivityEmphasizedCard>
  );
};
