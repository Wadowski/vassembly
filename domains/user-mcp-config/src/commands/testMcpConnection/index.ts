import type { McpConfigSchema } from '../../model/configSchema';
import type { TestConnectionResult } from '../../types';
import { decodePasswordFields } from '../shared/decodePasswordFields';
import { validateFieldValues } from '../shared/validateFieldValues';
import { getMcpTestAdapter } from './adapters';

export interface TestMcpConnectionCommandInput {
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  schema: McpConfigSchema;
  mcpSlug: string;
}

export const testMcpConnection = async (
  input: TestMcpConnectionCommandInput,
): Promise<TestConnectionResult> => {
  const { fieldValues, schema, mcpSlug } = input;

  validateFieldValues({ schema, values: fieldValues });

  const decodedFieldValues = decodePasswordFields({ fieldValues, schema });
  const adapter = getMcpTestAdapter({ slug: mcpSlug });
  const result = await adapter.test({ fieldValues: decodedFieldValues });

  return {
    success: result.success,
    message: result.message,
    error: result.error,
  };
};
