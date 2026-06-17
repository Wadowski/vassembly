import type { BaseMessage } from '@langchain/core/messages';

import { mapInvokeAbortError } from './mapInvokeAbortError';

export interface InvokeableChatModel {
  invoke: (
    messages: BaseMessage[],
    options?: { signal?: AbortSignal },
  ) => Promise<BaseMessage>;
}

export interface InvokeModelWithSignalParams {
  model: InvokeableChatModel;
  messages: BaseMessage[];
  signal?: AbortSignal;
}

export const invokeModelWithSignal = async ({
  model,
  messages,
  signal,
}: InvokeModelWithSignalParams): Promise<BaseMessage> => {
  try {
    return await model.invoke(messages, signal ? { signal } : undefined);
  } catch (error: unknown) {
    mapInvokeAbortError(error);
    throw error;
  }
};
