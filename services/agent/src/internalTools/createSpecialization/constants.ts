export const SPECIALIZATION_PROVISIONING_ADMIN_ID = 'system-seed-admin';

export const SPECIALIZATION_AGENT_ROLES = ['researcher', 'worker', 'validator'] as const;

export type SpecializationAgentRole = (typeof SPECIALIZATION_AGENT_ROLES)[number];

const SPECIALIZATION_WEB_SEARCH_GUIDANCE =
  'Always use web_search and web_page_content for anything asked — do not rely on your own knowledge. When using web_search, do not add dates to queries unless a specific time period is requested. Always seek the latest available information unless a historical date is specified.';

export const SPECIALIZATION_AGENT_RULES: Record<SpecializationAgentRole, string> = {
  researcher:
    `You research the given topic thoroughly and return a structured summary with sources and key findings. ${SPECIALIZATION_WEB_SEARCH_GUIDANCE}`,
  worker:
    `You execute the task step-by-step based on the provided plan and research. Focus on delivering concrete outputs. ${SPECIALIZATION_WEB_SEARCH_GUIDANCE}`,
  validator:
    `You review the work output for accuracy, completeness, and quality. Return a structured assessment with any issues or approvals. ${SPECIALIZATION_WEB_SEARCH_GUIDANCE}`,
};

export const SPECIALIZATION_AGENT_TOOL_IDS: string[] = [
  'web-search',
  'web-page-content',
  'skill-resolve',
  'skill-run-script',
];
