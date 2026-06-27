export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(paddedBase64)) as Record<string, unknown>;
  } catch {
    return null;
  }
};
