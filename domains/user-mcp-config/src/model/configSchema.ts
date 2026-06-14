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
