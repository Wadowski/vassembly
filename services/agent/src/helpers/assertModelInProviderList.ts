import { WrongParamError } from '@vassembly/errors';

interface AssertModelInProviderListParams {
  model: string;
  models?: string[];
}

export const assertModelInProviderList = (params: AssertModelInProviderListParams): void => {
  const { model, models } = params;
  if (!models?.includes(model)) {
    throw new WrongParamError('Selected model is not available for this provider');
  }
};
