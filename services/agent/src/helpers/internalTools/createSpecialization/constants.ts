export const SPECIALIZATION_PROVISIONING_ADMIN_ID = 'system-seed-admin';

export const SPECIALIZATION_AGENT_ROLES = ['researcher', 'worker', 'validator'] as const;

export type SpecializationAgentRole = (typeof SPECIALIZATION_AGENT_ROLES)[number];

export const SPECIALIZATION_AGENT_RULES: Record<SpecializationAgentRole, string> = {
  researcher:
    'You research the given topic thoroughly and return a structured summary with sources and key findings.',
  worker:
    'You execute the task step-by-step based on the provided plan and research. Focus on delivering concrete outputs.',
  validator:
    'You review the work output for accuracy, completeness, and quality. Return a structured assessment with any issues or approvals.',
};
