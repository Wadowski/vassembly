import { factory, translationFactory } from '@vassembly/model';

import { SystemAgentModel } from './model';

export const systemAgentFactory = factory(SystemAgentModel);

const TRANSLATION_MAP = [
  { fieldKey: 'name', translationKey: 'name' },
  { fieldKey: 'description', translationKey: 'description' },
  { fieldKey: 'rule', translationKey: 'rule' },
] as const;

export const systemAgentTranslationFactory = translationFactory(SystemAgentModel, [
  ...TRANSLATION_MAP,
]);
