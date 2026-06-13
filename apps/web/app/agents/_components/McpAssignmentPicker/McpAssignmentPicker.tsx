'use client';

import { useMemo } from 'react';

import { Button } from '@vassembly/ui-button';
import { Dropdown } from '@vassembly/ui-dropdown';
import { Tag } from '@vassembly/ui-tag';
import { Text } from '@vassembly/ui-text';
import { useRouter } from 'next/navigation';

import { AGENT_MAX_ASSIGNED_MCPS, MCP_MANAGE_HREF } from './constants';
import styles from './styles.module.scss';
import type { McpAssignmentOption, McpAssignmentPickerProps } from './types';

const buildMcpLabel = (mcp: McpAssignmentOption): string => `${mcp.name} (${mcp.slug})`;

export function McpAssignmentPicker({
  value,
  onChange,
  configuredMcps,
  isLoading = false,
  errorMessage,
  isDisabled = false,
  label = 'MCP tools',
  helperText,
  manageHref = MCP_MANAGE_HREF,
  manageLabel = 'Manage MCPs',
}: McpAssignmentPickerProps): JSX.Element {
  const router = useRouter();

  const lookup = useMemo(
    () => new Map(configuredMcps.map((mcp) => [mcp.id, mcp])),
    [configuredMcps],
  );

  const availableOptions = useMemo(
    () => configuredMcps.filter((mcp) => !value.includes(mcp.id)),
    [configuredMcps, value],
  );

  const isAtLimit = value.length >= AGENT_MAX_ASSIGNED_MCPS;

  const dropdownOptions = [
    { value: '', label: 'Add an MCP…' },
    ...availableOptions.map((mcp) => ({
      value: mcp.id,
      label: buildMcpLabel(mcp),
    })),
  ];

  const handleAdd = (nextValue: string): void => {
    if (nextValue === '' || value.includes(nextValue) || isAtLimit) {
      return;
    }
    onChange([...value, nextValue]);
  };

  const handleRemove = (mcpId: string): void => {
    onChange(value.filter((id) => id !== mcpId));
  };

  const handleManageClick = (): void => {
    router.push(manageHref);
  };

  const resolveChipLabel = (mcpId: string): string => {
    const mcp = lookup.get(mcpId);
    if (mcp === undefined) {
      return mcpId;
    }
    return buildMcpLabel(mcp);
  };

  const showEmptyConfiguredState = !isLoading && configuredMcps.length === 0;

  return (
    <div className={styles.pickerStack}>
      <Text variant="label">{label}</Text>
      {showEmptyConfiguredState ? (
        <div className={styles.emptyState}>
          <Text variant="body2">No MCPs configured yet.</Text>
          <Button size="small" variant="outlined" text={manageLabel} onClick={handleManageClick} />
        </div>
      ) : (
        <>
          <Dropdown
            id="agent-mcp-assignment"
            placeholder="Add an MCP…"
            options={dropdownOptions}
            value=""
            isDisabled={isDisabled || isLoading || isAtLimit || availableOptions.length === 0}
            isFullWidth
            onValueChange={handleAdd}
          />
          {value.length > 0 ? (
            <div className={styles.selectedList}>
              {value.map((mcpId) => (
                <Tag
                  key={mcpId}
                  size="small"
                  variant={lookup.has(mcpId) ? 'default' : 'warning'}
                  onRemove={isDisabled ? undefined : () => handleRemove(mcpId)}
                  removeLabel={`Remove ${resolveChipLabel(mcpId)}`}
                >
                  {resolveChipLabel(mcpId)}
                </Tag>
              ))}
            </div>
          ) : null}
          <Text variant="caption" className={styles.counterText}>
            {`${value.length}/${AGENT_MAX_ASSIGNED_MCPS} MCPs assigned`}
          </Text>
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
      {!showEmptyConfiguredState ? (
        <Button size="small" variant="outlined" text={manageLabel} onClick={handleManageClick} />
      ) : null}
    </div>
  );
}
