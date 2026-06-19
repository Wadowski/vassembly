import type { ProgressEvent } from '../types';

export const sortEventsByTimestamp = (events: ProgressEvent[]): ProgressEvent[] => {
  return [...events].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return timeA - timeB;
  });
};
