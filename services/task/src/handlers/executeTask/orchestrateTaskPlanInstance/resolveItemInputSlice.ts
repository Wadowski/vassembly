const SLOT_REF_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export interface ExtractSlotRefsParams {
  description: string;
}

export const extractSlotRefs = ({ description }: ExtractSlotRefsParams): string[] => {
  const matches = [...description.matchAll(SLOT_REF_PATTERN)];

  return [...new Set(matches.map((match) => match[1]).filter((slot): slot is string => Boolean(slot)))];
};

export interface PickFieldsParams {
  source: Record<string, unknown>;
  keys: string[];
}

export const pickFields = ({ source, keys }: PickFieldsParams): Record<string, unknown> => {
  return keys.reduce<Record<string, unknown>>((accumulator, key) => {
    if (key in source) {
      accumulator[key] = source[key];
    }

    return accumulator;
  }, {});
};

export interface ResolveItemInputSliceParams {
  templateItem: {
    description: string;
  };
  instanceInputDetails: Record<string, unknown>;
}

export const resolveItemInputSlice = ({
  templateItem,
  instanceInputDetails,
}: ResolveItemInputSliceParams): Record<string, unknown> => {
  const slotRefs = extractSlotRefs({ description: templateItem.description });

  if (slotRefs.length === 0) {
    return instanceInputDetails;
  }

  return pickFields({ source: instanceInputDetails, keys: slotRefs });
};
