export const USE_AGENT_DEPTH_ERROR = 'Maximum agent delegation depth reached.';

export const USE_AGENT_NOT_ALLOWED_ERROR = 'That agent cannot be invoked by this agent.';

export const USE_AGENT_AMBIGUITY_ERROR = 'Multiple agents match this name. Rename agents to continue.';

export const USE_AGENT_NO_CREDENTIAL_ERROR =
  'The selected agent does not have a connected AI integration.';

export const buildUseAgentNotFoundError = ({ name }: { name: string }): string =>
  `No agent named "${name}" was found.`;
