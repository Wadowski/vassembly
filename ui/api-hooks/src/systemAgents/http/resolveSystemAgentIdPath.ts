export const resolveSystemAgentIdPath = (id: string | undefined): string | undefined => {
  if (id === undefined || id === '') {
    return undefined;
  }

  return `/system-agents/${id}`;
};
