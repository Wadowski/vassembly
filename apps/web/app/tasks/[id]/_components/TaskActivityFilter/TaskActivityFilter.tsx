'use client';

import { useCallback, useMemo } from 'react';

import type { TaskActivityFilterGroup } from '@vassembly/ui-api-hooks';
import { MultiSelect } from '@vassembly/ui-system-design/multi-select';

import styles from './TaskActivityFilter.module.scss';

const FILTER_OPTIONS: { value: TaskActivityFilterGroup; label: string }[] = [
  { value: 'comments', label: 'Comments' },
  { value: 'responses', label: 'Agent responses' },
  { value: 'questions', label: 'Questions & answers' },
  { value: 'agentStarted', label: 'Agent started' },
  { value: 'agentFinished', label: 'Agent finished' },
  { value: 'agentFailed', label: 'Agent failed' },
  { value: 'agentWaiting', label: 'Agent waiting' },
  { value: 'mcpUsage', label: 'MCP tool calls' },
];

const FILTER_PLACEHOLDER = 'Filter activity';

const FILTER_GROUP_VALUES = new Set<TaskActivityFilterGroup>(
  FILTER_OPTIONS.map((option) => option.value),
);

export interface TaskActivityFilterProps {
  selectedGroups: TaskActivityFilterGroup[];
  onChange: (groups: TaskActivityFilterGroup[]) => void;
}

export const TaskActivityFilter = ({
  selectedGroups,
  onChange,
}: TaskActivityFilterProps): JSX.Element => {
  const options = useMemo(
    () =>
      FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  const handleValuesChange = useCallback(
    (values: string[]): void => {
      const groups = values.filter((value): value is TaskActivityFilterGroup =>
        FILTER_GROUP_VALUES.has(value as TaskActivityFilterGroup),
      );
      onChange(groups);
    },
    [onChange],
  );

  return (
    <div className={styles.filter} data-testid="task-activity-filter">
      <MultiSelect
        id="task-activity-filter-select"
        className={styles.multiSelect}
        label="Filter activity"
        size="small"
        placeholder={FILTER_PLACEHOLDER}
        options={options}
        values={selectedGroups}
        hasSelectAll
        onValuesChange={handleValuesChange}
      />
    </div>
  );
};
