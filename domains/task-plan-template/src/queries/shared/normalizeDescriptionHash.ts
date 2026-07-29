import { createHash } from 'node:crypto';

export interface NormalizeDescriptionHashParams {
  description: string;
}

const normalizeDescriptionText = (description: string): string => {
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeDescriptionHash = ({
  description,
}: NormalizeDescriptionHashParams): string => {
  const normalized = normalizeDescriptionText(description);

  return createHash('sha256').update(normalized).digest('hex');
};
