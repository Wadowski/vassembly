export const mockFetchResponse = ({
  ok,
  status,
  bodyText,
}: {
  ok: boolean;
  status: number;
  bodyText: string;
}): Response => {
  const response = {
    ok,
    status,
    clone: () => response,
    text: async () => bodyText,
    json: async () => JSON.parse(bodyText) as unknown,
  };
  return response as Response;
};
