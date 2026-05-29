import { useMemo } from 'react';

import { buildSyntheticTimelineEvents } from '../lib/buildSyntheticTimelineEvents';
import type { UseTaskDetailTimelineParams, UseTaskDetailTimelineResult } from './types';

export const useTaskDetailTimeline = ({
  task,
}: UseTaskDetailTimelineParams): UseTaskDetailTimelineResult => {
  const events = useMemo(() => buildSyntheticTimelineEvents(task), [task]);

  console.log("events", events);
  return { events };
};
