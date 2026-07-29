export interface MapInternalToolUsageEventDocumentParams {
  document: Record<string, unknown>;
}

export const mapInternalToolUsageEventDocument = ({
  document,
}: MapInternalToolUsageEventDocumentParams): Record<string, unknown> => {
  const id =
    document.id ?? (document._id != null ? String(document._id) : undefined);

  return {
    ...document,
    ...(id !== undefined ? { id } : {}),
  };
};
