'use client';

import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';

import { McpAgentListItem } from './McpAgentListItem';
import { McpUnassignAgentModal } from './McpUnassignAgentModal';
import { buildAgentEditHref } from './constants';
import styles from './styles.module.scss';
import type { McpAgentsSectionProps } from './types';
import { useMcpAgentsSection } from './useMcpAgentsSection';

export const McpAgentsSection = ({ mcpId, mcpName }: McpAgentsSectionProps): JSX.Element => {
  const section = useMcpAgentsSection({ mcpId, mcpName });

  return (
    <section className={styles.section}>
      <Text variant="h2" as="h2">Agents using this MCP</Text>
      {section.isLoading ? <Loader ariaLabel="Loading agents" /> : null}
      {section.isEmpty ? (
        <Text variant="body2" className={styles.emptyText}>
          No agents use this MCP yet
        </Text>
      ) : null}
      {!section.isLoading && section.agents.length > 0 ? (
        <div className={styles.agentList}>
          {section.agents.map((agent) => (
            <McpAgentListItem
              key={agent.id}
              agentId={agent.id}
              agentName={agent.name}
              category={agent.category}
              editHref={buildAgentEditHref(agent.id)}
              isRemoving={section.isUnassigning && section.unassignTarget?.agentId === agent.id}
              onEdit={section.handleEdit}
              onRemove={() => section.openUnassign(agent)}
            />
          ))}
        </div>
      ) : null}
      {section.unassignTarget !== null ? (
        <McpUnassignAgentModal
          open={section.unassignTarget !== null}
          mcpName={mcpName}
          agentName={section.unassignTarget.agentName}
          isLoading={section.isUnassigning}
          onConfirm={section.confirmUnassign}
          onCancel={section.closeUnassign}
        />
      ) : null}
    </section>
  );
};
