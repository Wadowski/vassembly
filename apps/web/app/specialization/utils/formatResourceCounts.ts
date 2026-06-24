const formatCount = ({ count, singular, plural }: { count: number; singular: string; plural: string }): string =>
  count === 1 ? singular.replace('{n}', String(count)) : plural.replace('{n}', String(count));

export const formatAgentMcpCounts = ({
  agentCount,
  mcpCount,
}: {
  agentCount: number;
  mcpCount: number;
}): string => {
  const agents = formatCount({
    count: agentCount,
    singular: '{n} agent',
    plural: '{n} agents',
  });
  const mcps = formatCount({
    count: mcpCount,
    singular: '{n} MCP',
    plural: '{n} MCPs',
  });

  return `${agents} · ${mcps}`;
};
