import { AgentCategory } from '@vassembly/domain-agent';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const agentCreateBodySchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]]),
  description: z.string().min(1).max(500),
  rule: z.string().min(1).max(2000),
  integrationCredentialId: z.string().optional(),
  assignedMcpIds: z.array(z.string().min(1)).max(5).optional(),
  assignedToolIds: z.array(z.string().min(1)).optional().default([]),
});

export const agentResponseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  rule: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  integrationCredentialId: z.string().optional(),
  assignedMcpIds: z.array(z.string()),
  assignedToolIds: z.array(z.string()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  removedAt: z.string().nullable().optional(),
});

export const agentCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    body: agentCreateBodySchema,
    response: withErrorResponses(agentResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authorizeProtectedRequest({ headers });
    const { agent } = await agentService.createAgent({ userId, body });
    return agent;
  },
});
