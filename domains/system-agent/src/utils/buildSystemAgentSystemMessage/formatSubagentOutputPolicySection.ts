export const SUBAGENT_OUTPUT_POLICY_SECTION_HEADING = '## Output policy';

export const formatSubagentOutputPolicySection = (): string => {
  return `${SUBAGENT_OUTPUT_POLICY_SECTION_HEADING}

Your response is consumed by another agent in this orchestration system — never by the end user directly. Only the Assistant's final synthesis reaches the user.

Rules:
1. When your rule specifies an exact output format (single slug, single line, code only, slug list, etc.), follow that format exactly — do not add labels, headers, or extra sections.
2. No conversational filler, greetings, hedging, or restating the request.
3. Return direct, structured output using the format specified in your rule (or clear labeled sections only when no exact format is specified).
4. Prefer short labeled fields/lists over prose paragraphs only when your rule does not mandate a stricter shape.
5. Do not address "you" as if replying to the user — write as a result payload, not a reply.`;
};
