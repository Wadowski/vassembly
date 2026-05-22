interface MockFetchResponseProps {
  ok: boolean;
  status: number;
  bodyText: string;
}

export const mockFetchResponse = ({ ok, status, bodyText }: MockFetchResponseProps): Response =>
  ({
    ok,
    status,
    json: (): Promise<unknown> => Promise.resolve(JSON.parse(bodyText)),
    text: (): Promise<string> => Promise.resolve(bodyText),
  }) as Response;
