import type { IconComponent } from '../../../_components/TaskList/types';

export interface SyntheticTimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  author: string;
  description?: string;
  icon?: IconComponent;
}
