import seedData from '../../seed/mcps.json';

import type { McpSeedEntry } from './types';

export const VALID_SEED_ENTRIES = seedData as McpSeedEntry[];

export const VALID_SEED_JSON = JSON.stringify(VALID_SEED_ENTRIES);
