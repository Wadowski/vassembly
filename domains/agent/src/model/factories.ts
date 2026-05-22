import { factory, translationFactory } from '@vassembly/model';

import { AgentModel } from './model';

export const agentFactory = factory(AgentModel);

const TRANSLATION_MAP = [
  { fieldKey: 'name', translationKey: 'name' },
  { fieldKey: 'description', translationKey: 'description' },
] as const;

export const agentTranslationFactory = translationFactory(AgentModel, [...TRANSLATION_MAP]);

