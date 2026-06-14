import type { InternalToolAccessScope } from '@vassembly/constants';

export { InternalToolAccessScope } from '@vassembly/constants';

export interface InternalToolDto {
  id: string;
  displayName: string;
  description: string;
  accessScope: InternalToolAccessScope;
}

export interface UseInternalToolsResult {
  data?: InternalToolDto[];
  loading: boolean;
  error?: Error;
  refetch: () => void;
}
