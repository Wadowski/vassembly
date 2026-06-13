interface LoggerMeta {
  sessionId: string;
  [key: string]: unknown;
}

export type Logger = (
  message: string,
  props: { meta: LoggerMeta; data?: Record<string, unknown> }
) => void;
