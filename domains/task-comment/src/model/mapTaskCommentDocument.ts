export interface MapTaskCommentDocumentParams {
  document: Record<string, unknown>;
}

export const mapTaskCommentDocument = ({
  document,
}: MapTaskCommentDocumentParams): Record<string, unknown> => {
  const id =
    document.id ??
    (document._id != null ? String(document._id) : undefined);

  return {
    ...document,
    ...(id !== undefined ? { id } : {}),
  };
};
