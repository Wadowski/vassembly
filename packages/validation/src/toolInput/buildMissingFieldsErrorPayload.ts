import type { ToolInputErrorPayload, ToolInputIssueLike } from './types';

const isMissingFieldIssue = (issue: ToolInputIssueLike): boolean => {
  return issue.code === 'invalid_type' || issue.code === 'too_small' || issue.code === 'invalid_enum_value';
};

export const buildMissingFieldsErrorPayload = ({
  issues,
  toolLabel,
}: {
  issues: ToolInputIssueLike[];
  toolLabel: string;
}): ToolInputErrorPayload => {
  const missingFields = issues
    .filter(isMissingFieldIssue)
    .map((issue) => issue.path.join('.'))
    .filter((field) => field.length > 0);

  if (missingFields.length === 0) {
    return {
      error: `${toolLabel} received an invalid payload`,
      code: 'INVALID_SHAPE',
      hint: issues.map((issue) => issue.message).join('; '),
    };
  }

  return {
    error: `${toolLabel} is missing required fields: ${missingFields.join(', ')}`,
    code: 'MISSING_REQUIRED_FIELDS',
    missingFields,
    hint: `Call ${toolLabel} again including: ${missingFields.join(', ')}. Do not guess values — use the actual data from context.`,
  };
};
