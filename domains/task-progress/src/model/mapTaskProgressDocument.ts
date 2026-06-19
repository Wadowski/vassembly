export interface MapTaskProgressDocumentParams {
  document: Record<string, unknown>;
}

export const mapTaskProgressDocument = ({
  document,
}: MapTaskProgressDocumentParams): Record<string, unknown> => {
  const id =
    document.id ??
    (document._id != null ? String(document._id) : undefined);

  return {
    ...document,
    ...(id !== undefined ? { id } : {}),
  };
};
