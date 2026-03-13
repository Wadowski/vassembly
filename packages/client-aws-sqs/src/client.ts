import { config } from "@vassembly/config";
import { InternalError } from "@vassembly/errors";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  ClientAwsSqsParams,
  PushMessageParams,
  ClientAwsSqs,
} from "./types";

const CONSOLE_LOG_PREFIX = "client-aws-sqs ::";

export const AwsSqsClient = ({ queueUrl }: ClientAwsSqsParams): ClientAwsSqs => {
  const sqsConfig = {
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  };

  const sqsClient = new SQSClient(sqsConfig);

  const pushMessage = async ({
    messageBody,
    messageAttributes,
    delaySeconds = 0,
  }: PushMessageParams): Promise<string> => {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        MessageAttributes: messageAttributes,
        DelaySeconds: delaySeconds,
      });
      const response = await sqsClient.send(command);
      return response.MessageId || "";
    } catch (err) {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on push message`);
    }
  };

  return {
    pushMessage,
  };
};
