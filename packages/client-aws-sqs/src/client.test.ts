import { describe, it, expect, vi, beforeEach } from "vitest";
import { AwsSqsClient } from "./client";
import { InternalError } from "@vassembly/errors";
import { SQSClient } from "@aws-sdk/client-sqs";

vi.mock("@vassembly/config", () => ({
  config: {
    aws: {
      region: "us-east-1",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
    },
  },
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  SendMessageCommand: vi.fn((input) => ({ input, name: "SendMessageCommand" })),
}));

describe("AwsSqsClient", () => {
  const queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue";
  let client: ReturnType<typeof AwsSqsClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = AwsSqsClient({ queueUrl });
  });

  describe("initialization", () => {
    it("should create a client with the provided queue URL", () => {
      const sqsClient = AwsSqsClient({ queueUrl: "https://test-queue-url" });
      expect(sqsClient).toBeDefined();
      expect(sqsClient.pushMessage).toBeDefined();
    });
  });

  describe("pushMessage", () => {
    it("should return message ID on successful message push", async () => {
      const messageBody = "test message";
      const messageId = "test-message-id-123";

      const mockSend = vi.mocked(SQSClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: messageId,
        });
      }

      const result = await client.pushMessage({ messageBody });
      expect(typeof result).toBe("string");
      expect(result).toBe(messageId);
    });

    it("should accept message attributes", async () => {
      const messageBody = "test message with attributes";
      const messageId = "test-message-id-456";
      const messageAttributes = {
        CustomAttribute: {
          StringValue: "custom-value",
          DataType: "String",
        },
      };

      const mockSend = vi.mocked(SQSClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: messageId,
        });
      }

      const result = await client.pushMessage({
        messageBody,
        messageAttributes,
      });
      expect(result).toBe(messageId);
    });

    it("should accept delay seconds parameter", async () => {
      const messageBody = "delayed message";
      const messageId = "test-message-id-789";
      const delaySeconds = 30;

      const mockSend = vi.mocked(SQSClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: messageId,
        });
      }

      const result = await client.pushMessage({
        messageBody,
        delaySeconds,
      });
      expect(result).toBe(messageId);
    });

    it("should accept all optional parameters together", async () => {
      const messageBody = "complex message";
      const messageId = "test-message-id-complex";
      const messageAttributes = {
        Type: {
          StringValue: "notification",
          DataType: "String",
        },
        Priority: {
          StringValue: "high",
          DataType: "String",
        },
      };
      const delaySeconds = 60;

      const mockSend = vi.mocked(SQSClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: messageId,
        });
      }

      const result = await client.pushMessage({
        messageBody,
        messageAttributes,
        delaySeconds,
      });
      expect(result).toBe(messageId);
    });

    it("should throw InternalError on AWS send failure", async () => {
      const messageBody = "failing message";

      const mockSend = vi.mocked(SQSClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(client.pushMessage({ messageBody })).rejects.toThrow(
        InternalError
      );
    });
  });
});
