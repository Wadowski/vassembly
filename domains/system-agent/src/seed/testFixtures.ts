import { AgentCategory } from '../constants';

import type { SystemAgentSeedEntry } from './types';

export const VALID_SEED_ENTRIES: SystemAgentSeedEntry[] = [
  {
    name: 'Assistant',
    description: 'Main assistant',
    rule: 'You are the main assistant.',
    category: AgentCategory.Utility,
    assignedToolIds: ['agent-use', 'agent-list'],
  },
  {
    name: 'Intent classifier',
    description: 'Classifies user input',
    rule: 'Classify the input.',
    category: AgentCategory.Utility,
    assignedToolIds: [],
  },
];

export const VALID_SEED_JSON = JSON.stringify(VALID_SEED_ENTRIES);
