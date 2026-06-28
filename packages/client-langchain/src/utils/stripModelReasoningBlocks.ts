const GEMMA_CHANNEL_BLOCK_PATTERN = /<\|channel>[\s\S]*?<channel\|>/g;
const GEMMA_CHANNEL_UNCLOSED_PATTERN = /<\|channel>[\s\S]*$/;
const GEMMA_THOUGHT_BLOCK_PATTERN = /<\|thought>[\s\S]*?<thought\|>/g;
const GEMMA_THOUGHT_UNCLOSED_PATTERN = /<\|thought>[\s\S]*$/;
const GEMMA_TOOL_CALL_BLOCK_PATTERN = /<\|tool_call>[\s\S]*?<tool_call\|>/g;
const THINK_OPEN = '<' + 'think' + '>';
const THINK_CLOSE = '<' + '/think' + '>';
const THINK_BLOCK_PATTERN = new RegExp(`${THINK_OPEN}[\\s\\S]*?${THINK_CLOSE}`, 'gi');
const THINK_UNCLOSED_PATTERN = new RegExp(`${THINK_OPEN}[\\s\\S]*$`, 'gi');

const XML_STYLE_REASONING_BLOCK_PATTERNS = [
  THINK_BLOCK_PATTERN,
  /<think>[\s\S]*?<\/redacted_thinking>/g,
  /<thought>[\s\S]*?<\/thought>/gi,
  /<thinking>[\s\S]*?<\/thinking>/gi,
  /<reasoning>[\s\S]*?<\/reasoning>/gi,
  /<REASONING_SCRATCHPAD>[\s\S]*?<\/REASONING_SCRATCHPAD>/g,
];

const XML_STYLE_REASONING_UNCLOSED_PATTERNS = [
  THINK_UNCLOSED_PATTERN,
  /<think>[\s\S]*$/,
  /<thought>[\s\S]*$/gi,
  /<thinking>[\s\S]*$/gi,
  /<reasoning>[\s\S]*$/gi,
  /<REASONING_SCRATCHPAD>[\s\S]*$/,
];

const ORPHAN_REASONING_TAG_PATTERN =
  /<\/?(?:think|thinking|reasoning|thought|REASONING_SCRATCHPAD|redacted_thinking)>\s*/gi;

const ORPHAN_GEMMA_CONTROL_TAGS = ['<channel|>', '<thought|>', '<turn|>', '<|turn>'] as const;

const applyPatterns = (text: string, patterns: RegExp[]): string =>
  patterns.reduce((current, pattern) => current.replace(pattern, ''), text);

export const stripModelReasoningBlocks = (text: string): string => {
  let normalized = text;

  normalized = normalized.replace(GEMMA_CHANNEL_BLOCK_PATTERN, '');
  normalized = normalized.replace(GEMMA_CHANNEL_UNCLOSED_PATTERN, '');
  normalized = normalized.replace(GEMMA_THOUGHT_BLOCK_PATTERN, '');
  normalized = normalized.replace(GEMMA_THOUGHT_UNCLOSED_PATTERN, '');
  normalized = normalized.replace(GEMMA_TOOL_CALL_BLOCK_PATTERN, '');

  normalized = applyPatterns(normalized, XML_STYLE_REASONING_BLOCK_PATTERNS);
  normalized = applyPatterns(normalized, XML_STYLE_REASONING_UNCLOSED_PATTERNS);

  for (const tag of ORPHAN_GEMMA_CONTROL_TAGS) {
    normalized = normalized.replaceAll(tag, '');
  }

  normalized = normalized.replace(ORPHAN_REASONING_TAG_PATTERN, '');

  return normalized.trim();
};
