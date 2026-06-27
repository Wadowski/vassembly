interface MockFetchResponseProps {
  ok: boolean;
  status: number;
  bodyText: string;
  headers?: Record<string, string>;
}

export const mockFetchResponse = ({
  ok,
  status,
  bodyText,
  headers = {},
}: MockFetchResponseProps): Response =>
  ({
    ok,
    status,
    headers: {
      get: (name: string): string | null => headers[name] ?? null,
    },
    json: (): Promise<unknown> => Promise.resolve(JSON.parse(bodyText)),
    text: (): Promise<string> => Promise.resolve(bodyText),
  }) as Response;
