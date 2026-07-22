'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { Button } from '@vassembly/ui-system-design/button';
import { MultiSelect } from '@vassembly/ui-system-design/multi-select';
import { Text } from '@vassembly/ui-system-design/text';
import { useAvailableTags } from '@vassembly/ui-api-hooks';

import styles from './McpTagFilter.module.scss';

export interface McpTagFilterProps {
  selectedTags: string[];
  isDisabled?: boolean;
  onChange: (tags: string[]) => void;
  onReset: () => void;
}

const TAG_FILTER_PLACEHOLDER = 'Filter by tags';

export const McpTagFilter = ({
  selectedTags,
  isDisabled = false,
  onChange,
  onReset,
}: McpTagFilterProps): JSX.Element => {
  const { data: availableTags, execute: fetchTags } = useAvailableTags();

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const options = useMemo(
    () =>
      (availableTags ?? []).map((tag) => ({
        value: tag,
        label: tag,
      })),
    [availableTags],
  );

  const handleValuesChange = useCallback(
    (values: string[]): void => {
      onChange(values);
    },
    [onChange],
  );

  const handleResetClick = useCallback((): void => {
    onReset();
  }, [onReset]);

  const hasSelectedTags = selectedTags.length > 0;

  return (
    <div className={styles.filter}>
      <MultiSelect
        id="mcp-tag-filter"
        className={styles.multiSelect}
        size="small"
        placeholder={TAG_FILTER_PLACEHOLDER}
        options={options}
        values={selectedTags}
        isDisabled={isDisabled}
        isFullWidth
        onValuesChange={handleValuesChange}
      />
      <Text variant="caption" className={styles.helperText}>
        Match MCPs with ANY tag
      </Text>
      {hasSelectedTags ? (
        <Button variant="text" size="small" text="Reset" onClick={handleResetClick} />
      ) : null}
    </div>
  );
};
