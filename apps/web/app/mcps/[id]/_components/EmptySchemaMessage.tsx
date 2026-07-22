'use client';

import { Text } from '@vassembly/ui-system-design/text';

import { NO_CONFIGURATION_MESSAGE } from './constants';
import styles from './McpDetailPageStates.module.scss';

/**
 * Message shown when an MCP has no configuration schema.
 */
export const EmptySchemaMessage = (): JSX.Element => {
  return (
    <Text variant="body1" className={styles.emptySchemaMessage}>{NO_CONFIGURATION_MESSAGE}</Text>
  );
};
