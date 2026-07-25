export const McpTransport = {
  NativeHttp: 'native-http',
  StdioWrapped: 'stdio-wrapped',
} as const;

export type McpTransportValue = (typeof McpTransport)[keyof typeof McpTransport];
