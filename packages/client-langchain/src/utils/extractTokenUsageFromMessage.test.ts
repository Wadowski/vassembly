import { AIMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import { extractTokenUsageFromMessage, mergeTokenUsage } from './extractTokenUsageFromMessage';

describe('extractTokenUsageFromMessage', () => {
  it('should extract usage from usage_metadata', () => {
    const message = new AIMessage({
      content: 'response',
      usage_metadata: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
      },
    });

    expect(extractTokenUsageFromMessage(message)).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  it('should extract usage from response_metadata token_usage', () => {
    const message = new AIMessage({
      content: 'response',
      response_metadata: {
        token_usage: {
          prompt_tokens: 200,
          completion_tokens: 80,
          total_tokens: 280,
        },
      },
    });

    expect(extractTokenUsageFromMessage(message)).toEqual({
      promptTokens: 200,
      completionTokens: 80,
      totalTokens: 280,
    });
  });

  it('should return undefined when metadata is missing', () => {
    const message = new AIMessage({ content: 'response' });

    expect(extractTokenUsageFromMessage(message)).toBeUndefined();
  });
});

describe('mergeTokenUsage', () => {
  it('should accumulate token counts', () => {
    expect(
      mergeTokenUsage(
        { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
      ),
    ).toEqual({
      promptTokens: 120,
      completionTokens: 60,
      totalTokens: 180,
    });
  });
});
