export interface MakeRegistryKeyParams {
  taskId: string;
  invocationId: string;
}

export const makeRegistryKey = ({ taskId, invocationId }: MakeRegistryKeyParams): string =>
  `${taskId}:${invocationId}`;
