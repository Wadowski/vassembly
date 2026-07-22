import type { ReactNode } from 'react';
import { Text } from '@vassembly/ui-system-design/text';
import styles from './Alert.module.scss';

export const AlertDetailsBody = ({ details }: { details: ReactNode }): ReactNode => {
  if (typeof details === 'string') {
    return <Text variant="body2" as="div">{details}</Text>;
  }
  return details;
};

export interface AlertCollapsibleDetailsProps {
  detailsPanelId: string;
  isExpanded: boolean;
  details: ReactNode;
}

export const AlertCollapsibleDetails = ({
  detailsPanelId,
  isExpanded,
  details,
}: AlertCollapsibleDetailsProps): JSX.Element => {
  return (
    <div id={detailsPanelId} className={styles.details} hidden={!isExpanded}>
      <AlertDetailsBody details={details} />
    </div>
  );
}
