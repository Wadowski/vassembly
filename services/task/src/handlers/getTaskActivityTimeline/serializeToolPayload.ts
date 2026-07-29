export interface SerializeToolPayloadParams {
  payload: Record<string, unknown> | null | undefined;
}

export const serializeToolPayload = ({
  payload,
}: SerializeToolPayloadParams): string | undefined => {
  if (payload === null || payload === undefined || Object.keys(payload).length === 0) {
    return undefined;
  }

  return JSON.stringify(payload, null, 2);
};
