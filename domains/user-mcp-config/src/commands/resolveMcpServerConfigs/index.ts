import { decodeEncryptedFieldValues } from '../shared/decodeEncryptedFieldValues';
import { getUserMcpConfigModel } from '../../queries/getUserMcpConfigModel';
import { getMcpRuntimeAdapter } from './adapters';

import type { ResolveMcpServerConfigsParams, ResolveMcpServerConfigsResult } from './types';

export const resolveMcpServerConfigs = async (
  params: ResolveMcpServerConfigsParams,
): Promise<ResolveMcpServerConfigsResult> => {
  const serverConfigs: ResolveMcpServerConfigsResult['serverConfigs'] = [];
  const skippedMcpIds: string[] = [];

  for (const { mcpId, slug } of params.mcpConfigs) {
    const config = await getUserMcpConfigModel({
      userId: params.userId,
      mcpId,
    });

    if (!config) {
      skippedMcpIds.push(mcpId);
      continue;
    }

    const decodedFieldValues = decodeEncryptedFieldValues(config.fieldValues ?? {});
    const adapter = getMcpRuntimeAdapter({ slug });
    const serverConfig = adapter.toServerConfig({ mcpId, fieldValues: decodedFieldValues });

    if (!serverConfig) {
      skippedMcpIds.push(mcpId);
      continue;
    }

    serverConfigs.push(serverConfig);
  }

  return { serverConfigs, skippedMcpIds };
};
