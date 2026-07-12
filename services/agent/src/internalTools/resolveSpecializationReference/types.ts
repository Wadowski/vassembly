import type { InternalToolContext } from '../types';

export interface ResolveSpecializationReferenceParams {
  specializationRef?: string;
  context: InternalToolContext;
  preferCallerSpecialization?: boolean;
}

export interface ResolveSpecializationReferenceResult {
  id: string;
  name: string;
}
