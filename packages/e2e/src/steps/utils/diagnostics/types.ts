export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: number;
  location?: string;
}

export interface RequestLog {
  method: string;
  url: string;
  body?: string;
  timestamp: number;
  status?: number;
}

export interface DiagnosticsState {
  consoleMessages: ConsoleMessage[];
  requests: RequestLog[];
  requestCountByUrl: Map<string, number>;
  requestCountByOperation: Map<string, number>;
}

export interface RequestViolation {
  url: string;
  count: number;
  type: 'url' | 'operation';
}

export class ConsoleErrorViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsoleErrorViolation';
  }
}

export class RequestLoopViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestLoopViolation';
  }
}
