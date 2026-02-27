export interface ClientAwsSqsParams {
  queueUrl: string;
}

export interface PushMessageParams {
  messageBody: string;
  messageAttributes?: Record<string, { StringValue: string; DataType: string }>;
  delaySeconds?: number;
}

export interface ClientAwsSqs {
  pushMessage: (params: PushMessageParams) => Promise<string>;
}
