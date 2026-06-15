import { formatDuration } from './formatDuration';

import type { ProgressEvent } from '../types';

export const getProgressEventTitle = (
  event: Pick<ProgressEvent, 'state' | 'duration' | 'errorDetails'>,
): string => {
  if (event.state === 'STARTED') {
    return 'Processing started';
  }

  if (event.state === 'COMPLETED') {
    if (event.duration !== null) {
      return `Completed in ${formatDuration(event.duration)}`;
    }

    return 'Completed';
  }

  if (event.state === 'FAILED') {
    if (event.errorDetails?.type) {
      return `Failed: ${event.errorDetails.type}`;
    }

    return 'Failed';
  }

  return event.state;
};
