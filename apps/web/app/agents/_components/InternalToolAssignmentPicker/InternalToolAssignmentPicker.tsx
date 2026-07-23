'use client';

import { useMemo } from 'react';

import { Dropdown } from '@vassembly/ui-system-design/dropdown';
import { Tag } from '@vassembly/ui-system-design/tag';
import { Text } from '@vassembly/ui-system-design/text';

import {
  INTERNAL_TOOL_PICKER_HELPER_TEXT,
  INTERNAL_TOOL_PICKER_LABEL,
  INTERNAL_TOOL_PICKER_PLACEHOLDER,
  INTERNAL_TOOL_STALE_CHIP_MESSAGE,
} from './constants';
import styles from './styles.module.scss';
import tagListStyles from '../shared/tagList.module.scss';
import type { InternalToolAssignmentPickerProps } from './types';

export function InternalToolAssignmentPicker({
  value,
  onChange,
  tools,
  isLoading = false,
  errorMessage,
  isDisabled = false,
  label = INTERNAL_TOOL_PICKER_LABEL,
  helperText = INTERNAL_TOOL_PICKER_HELPER_TEXT,
}: InternalToolAssignmentPickerProps): JSX.Element {
  const lookup = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);

  const availableOptions = useMemo(
    () => tools.filter((tool) => !value.includes(tool.id)),
    [tools, value],
  );

  const dropdownOptions = [
    { value: '', label: INTERNAL_TOOL_PICKER_PLACEHOLDER },
    ...availableOptions.map((tool) => ({
      value: tool.id,
      label: tool.displayName,
    })),
  ];

  const handleAdd = (nextValue: string): void => {
    if (nextValue === '' || value.includes(nextValue)) {
      return;
    }
    onChange([...value, nextValue]);
  };

  const handleRemove = (toolId: string): void => {
    onChange(value.filter((id) => id !== toolId));
  };

  const resolveChipLabel = (toolId: string): string => {
    const tool = lookup.get(toolId);
    if (tool === undefined) {
      return INTERNAL_TOOL_STALE_CHIP_MESSAGE;
    }
    return tool.displayName;
  };

  const showEmptyCatalogState = !isLoading && tools.length === 0;

  return (
    <div className={styles.pickerStack}>
      <Text variant="label">{label}</Text>
      {showEmptyCatalogState ? (
        <div className={styles.emptyState}>
          <Text variant="body2">No internal tools are available for this agent type.</Text>
        </div>
      ) : (
        <>
          <Dropdown
            id="agent-internal-tool-assignment"
            placeholder={INTERNAL_TOOL_PICKER_PLACEHOLDER}
            options={dropdownOptions}
            value=""
            isDisabled={isDisabled || isLoading || availableOptions.length === 0}
            onValueChange={handleAdd}
          />
          {value.length > 0 ? (
            <div className={tagListStyles.tagList}>
              {value.map((toolId) => (
                <Tag
                  key={toolId}
                  size="small"
                  variant={lookup.has(toolId) ? 'default' : 'warning'}
                  onRemove={isDisabled ? undefined : () => handleRemove(toolId)}
                  removeLabel={`Remove ${resolveChipLabel(toolId)}`}
                >
                  {resolveChipLabel(toolId)}
                </Tag>
              ))}
            </div>
          ) : null}
        </>
      )}
      {errorMessage !== undefined ? (
        <Text variant="caption" className={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}
      {helperText !== undefined ? (
        <Text variant="caption" className={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </div>
  );
}
