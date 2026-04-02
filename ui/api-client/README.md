# @vassembly/ui-api-client

Typed REST client built on native `fetch`, and a GraphQL client backed by **Apollo Client** (`HttpLink` + `InMemoryCache`), for web apps in the monorepo.

## Usage

```ts
import { createHttpClient, createGraphQLClient } from '@vassembly/ui-api-client';

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  getAuthToken: () => localStorage.getItem('token') ?? undefined,
});

const data = await http.get<{ ok: boolean }>({ path: '/health' });

const gql = createGraphQLClient({
  endpoint: 'https://api.example.com/graphql',
});

const result = await gql.query<{ me: { id: string } }, Record<string, never>>({
  query: `query { me { id } }`,
});
```

Errors are instances of `@vassembly/errors` classes (`UnauthorizedError`, `NotFoundError`, etc.). Apollo network and GraphQL errors are mapped to those types where possible.

The GraphQL layer uses `fetchPolicy: 'no-cache'` and `errorPolicy: 'none'` on the underlying Apollo client so each call behaves like a one-off HTTP request. Query strings are parsed with the `graphql` package; invalid syntax yields `WrongParamError`.

JSON request and response bodies are assumed for the REST client unless you rely on default parsing behavior documented in the implementation.
