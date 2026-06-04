'use client';

import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';

import { TASK_EMPTY_DESCRIPTION_LABEL } from '../../../_components/TaskList/constants';
import pageStyles from '../TaskDetailPage.module.scss';
import type { TaskDetailDescriptionProps } from './types';

export const TaskDetailDescription = ({ description }: TaskDetailDescriptionProps): JSX.Element => {
  const trimmedDescription = description.trim();
  const isEmpty = trimmedDescription === '';
  const displayText = isEmpty ? TASK_EMPTY_DESCRIPTION_LABEL : description;
  const bodyClassName = resolveClassName(
    pageStyles.descriptionText,
    isEmpty ? pageStyles.descriptionEmpty : undefined,
  );

  return (
    <section aria-labelledby="task-detail-description-heading" className={pageStyles.sectionStack}>
      <Text
        variant="label"
        id="task-detail-description-heading"
        className={pageStyles.sectionLabel}
      >
        Description
      </Text>
      <Text variant="body1" className={bodyClassName} data-testid="task-detail-description">
        {displayText}
      </Text>
    </section>
  );
};
