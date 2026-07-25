export interface MapMcpUsageEventDocumentParams {
  document: Record<string, unknown>;
}

export const mapMcpUsageEventDocument = ({
  document,
}: MapMcpUsageEventDocumentParams): Record<string, unknown> => {
  const id =
    document.id ?? (document._id != null ? String(document._id) : undefined);

  return {
    ...document,
    ...(id !== undefined ? { id } : {}),
  };
};
