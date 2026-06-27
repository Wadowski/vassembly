export const SPECIALIZATION_PROVISIONING_ADMIN_ID = 'system-seed-admin';

export const SPECIALIZATION_AGENT_ROLES = ['researcher', 'worker', 'validator'] as const;

export type SpecializationAgentRole = (typeof SPECIALIZATION_AGENT_ROLES)[number];

export const SPECIALIZATION_AGENT_RULES: Record<SpecializationAgentRole, string> = {
  researcher:
    'You research the given topic thoroughly and return a structured summary with sources and key findings. Use web_search to find relevant pages and web_page_content to read source material.',
  worker:
    'You execute the task step-by-step based on the provided plan and research. Focus on delivering concrete outputs. Use web_search and web_page_content when you need external information.',
  validator:
    'You review the work output for accuracy, completeness, and quality. Return a structured assessment with any issues or approvals. Use web_search and web_page_content to verify claims when needed.',
};

export const SPECIALIZATION_AGENT_TOOL_IDS: string[] = ['web-search', 'web-page-content'];
