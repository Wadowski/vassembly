import { describe, expect, it } from 'vitest';

import { stripModelReasoningBlocks } from './stripModelReasoningBlocks';

describe('stripModelReasoningBlocks', () => {
  it('should return plain text unchanged when no reasoning markers are present', () => {
    expect(stripModelReasoningBlocks('Hello world')).toBe('Hello world');
  });

  it('should strip Gemma channel reasoning blocks and keep the visible answer', () => {
    const input =
      '<|channel>thought\nAnalyze the request.\n<channel|>The Roman Empire built extensive road networks.';

    expect(stripModelReasoningBlocks(input)).toBe(
      'The Roman Empire built extensive road networks.',
    );
  });

  it('should strip empty Gemma thought delimiter pairs', () => {
    expect(stripModelReasoningBlocks('<|thought><thought|>Blue is a color.')).toBe(
      'Blue is a color.',
    );
  });

  it('should strip Gemma thought blocks with reasoning content', () => {
    const input = '<|thought>Plan the answer.<thought|>Paris is the capital of France.';

    expect(stripModelReasoningBlocks(input)).toBe('Paris is the capital of France.');
  });

  it('should strip redacted_thinking blocks from Qwen and DeepSeek style output', () => {
    const input = '<think>Internal reasoning</think>Final answer.';

    expect(stripModelReasoningBlocks(input)).toBe('Final answer.');
  });

  it('should strip thought xml blocks from Gemma style output', () => {
    const input = '<thought>Reason here</thought>Visible response.';

    expect(stripModelReasoningBlocks(input)).toBe('Visible response.');
  });

  it('should strip unclosed reasoning blocks at end of output', () => {
    const input = 'Answer first.<|channel>thought\nStill thinking';

    expect(stripModelReasoningBlocks(input)).toBe('Answer first.');
  });
});
