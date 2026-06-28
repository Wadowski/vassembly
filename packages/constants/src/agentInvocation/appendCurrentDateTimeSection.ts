import { formatCurrentDateTimeSection } from './formatCurrentDateTimeSection';

import type { AppendCurrentDateTimeSectionParams } from './types';

export const appendCurrentDateTimeSection = ({
  systemMessage,
  now,
}: AppendCurrentDateTimeSectionParams): string =>
  `${systemMessage}\n\n${formatCurrentDateTimeSection({ now })}`;
