import { z } from 'zod';

export const McpConfigFieldType = {
  Text: 'text',
  Password: 'password',
  Select: 'select',
  Checkbox: 'checkbox',
} as const;

export type McpConfigFieldTypeValue =
  (typeof McpConfigFieldType)[keyof typeof McpConfigFieldType];

export interface McpConfigFieldOption {
  value: string;
  label: string;
}

export interface McpConfigFieldSchema {
  key: string;
  label: string;
  type: McpConfigFieldTypeValue;
  description?: string;
  required?: boolean;
  defaultValue?: string | boolean;
  placeholder?: string;
  options?: McpConfigFieldOption[];
  format?: 'url' | 'email';
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface McpConfigSchema {
  fields: McpConfigFieldSchema[];
}

export const mcpConfigFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const mcpConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'password', 'select', 'checkbox']),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  defaultValue: z.union([z.string(), z.boolean()]).optional(),
  placeholder: z.string().optional(),
  options: z.array(mcpConfigFieldOptionSchema).optional(),
  format: z.enum(['url', 'email']).optional(),
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
});

export const mcpConfigSchema = z.object({
  fields: z.array(mcpConfigFieldSchema),
});
