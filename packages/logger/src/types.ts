interface LoggerMeta {
  sessionId: string;
  [key: string]: any;
}

export type Logger = (
  message: string,
  props: { meta: LoggerMeta; data?: Record<string, any> }
) => void;
  