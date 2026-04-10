import type { HTTPMethod, InferBody, InferQuery, InferResponse, RouteDefinition, RouteSchemaShape } from "./types";

interface DefineRouteProps<S extends RouteSchemaShape> {
  method: HTTPMethod;
  url: string;
  schema?: S;
  handler: (input: { body: InferBody<S>; query: InferQuery<S> }) => Promise<InferResponse<S>>;
}

export const defineRoute = <S extends RouteSchemaShape>(args: DefineRouteProps<S>): RouteDefinition => args as unknown as RouteDefinition;

export const routesWithPrefix = (prefix: string, routes: RouteDefinition[]): RouteDefinition[] => routes.map((route) => ({
  ...route,
  prefix,
}));
