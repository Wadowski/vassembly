import { Text } from '@vassembly/ui-system-design/text';
import type { TableCaptionProps } from './types';

export const TableCaption = (props: TableCaptionProps): JSX.Element => {
  const { caption } = props;
  return (
    <caption>
      <Text as="span" variant="caption">
        {caption}
      </Text>
    </caption>
  );
};

TableCaption.displayName = 'TableCaption';
