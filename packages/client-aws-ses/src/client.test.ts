import { describe, it, expect, vi, beforeEach } from "vitest";
import { AwsSesClient } from "./client.js";
import { InternalError } from "@vassembly/errors";
import { SESClient } from "@aws-sdk/client-ses";

vi.mock("@vassembly/config", () => ({
  config: {
    aws: {
      region: "us-east-1",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
    },
  },
}));

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  CreateTemplateCommand: vi.fn((input) => ({ input, name: "CreateTemplateCommand" })),
  UpdateTemplateCommand: vi.fn((input) => ({ input, name: "UpdateTemplateCommand" })),
  DeleteTemplateCommand: vi.fn((input) => ({ input, name: "DeleteTemplateCommand" })),
  GetTemplateCommand: vi.fn((input) => ({ input, name: "GetTemplateCommand" })),
  ListTemplatesCommand: vi.fn((input) => ({ input, name: "ListTemplatesCommand" })),
  SendTemplatedEmailCommand: vi.fn((input) => ({ input, name: "SendTemplatedEmailCommand" })),
}));

describe("AwsSesClient", () => {
  let client: ReturnType<typeof AwsSesClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = AwsSesClient();
  });

  describe("initialization", () => {
    it("should create a client with optional configuration set name", () => {
      const sesClient = AwsSesClient({ configurationSetName: "test-config-set" });
      expect(sesClient).toBeDefined();
      expect(sesClient.createEmailTemplate).toBeDefined();
      expect(sesClient.updateEmailTemplate).toBeDefined();
      expect(sesClient.deleteEmailTemplate).toBeDefined();
      expect(sesClient.getEmailTemplate).toBeDefined();
      expect(sesClient.listEmailTemplates).toBeDefined();
      expect(sesClient.sendEmail).toBeDefined();
    });
  });

  describe("createEmailTemplate", () => {
    it("should create an email template successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.createEmailTemplate({
        name: "welcome",
        subject: "Welcome to our service",
        html: "<h1>Welcome!</h1>",
        text: "Welcome!",
      });

      expect(result).toBeUndefined();
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.createEmailTemplate({
          name: "welcome",
          subject: "Welcome",
          html: "<h1>Welcome</h1>",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("updateEmailTemplate", () => {
    it("should update an email template successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.updateEmailTemplate({
        name: "welcome",
        subject: "Updated Welcome",
        html: "<h1>Updated Welcome!</h1>",
      });

      expect(result).toBeUndefined();
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.updateEmailTemplate({
          name: "welcome",
          subject: "Updated",
          html: "<h1>Updated</h1>",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("deleteEmailTemplate", () => {
    it("should delete an email template successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.deleteEmailTemplate({
        name: "welcome",
      });

      expect(result).toBeUndefined();
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.deleteEmailTemplate({ name: "welcome" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("getEmailTemplate", () => {
    it("should retrieve an email template successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          Template: {
            TemplateName: "welcome",
            SubjectPart: "Welcome",
            HtmlPart: "<h1>Welcome</h1>",
            TextPart: "Welcome",
          },
        });
      }

      const result = await client.getEmailTemplate({ name: "welcome" });

      expect(result).toBeDefined();
      expect(result.name).toBe("welcome");
      expect(result.subject).toBe("Welcome");
      expect(result.html).toBe("<h1>Welcome</h1>");
    });

    it("should handle template without text part", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          Template: {
            TemplateName: "welcome",
            SubjectPart: "Welcome",
            HtmlPart: "<h1>Welcome</h1>",
          },
        });
      }

      const result = await client.getEmailTemplate({ name: "welcome" });

      expect(result.text).toBeUndefined();
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.getEmailTemplate({ name: "non-existent" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("listEmailTemplates", () => {
    it("should list all email templates successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          TemplatesMetadata: [
            {
              Name: "welcome",
              CreatedTimestamp: new Date("2024-01-01"),
            },
            {
              Name: "reset-password",
              CreatedTimestamp: new Date("2024-01-02"),
            },
          ],
        });
      }

      const result = await client.listEmailTemplates();

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0]?.name).toBe("welcome");
      expect(result.templates[1]?.name).toBe("reset-password");
    });

    it("should return empty array when no templates exist", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          TemplatesMetadata: [],
        });
      }

      const result = await client.listEmailTemplates();

      expect(result.templates).toHaveLength(0);
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(client.listEmailTemplates()).rejects.toThrow(InternalError);
    });
  });

  describe("sendEmail", () => {
    it("should send an email successfully", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: "test-message-id-123",
        });
      }

      const result = await client.sendEmail({
        templateName: "welcome",
        recipients: ["user@example.com"],
        source: "noreply@example.com",
      });

      expect(result).toBe("test-message-id-123");
    });

    it("should send email with template data", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: "test-message-id-456",
        });
      }

      const result = await client.sendEmail({
        templateName: "welcome",
        recipients: ["user@example.com"],
        source: "noreply@example.com",
        templateData: {
          name: "John Doe",
          confirmUrl: "https://example.com/confirm",
        },
      });

      expect(result).toBe("test-message-id-456");
    });

    it("should send email to multiple recipients", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          MessageId: "test-message-id-789",
        });
      }

      const result = await client.sendEmail({
        templateName: "welcome",
        recipients: ["user1@example.com", "user2@example.com"],
        source: "noreply@example.com",
      });

      expect(result).toBe("test-message-id-789");
    });

    it("should throw InternalError on failure", async () => {
      const mockSend = vi.mocked(SESClient).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.sendEmail({
          templateName: "welcome",
          recipients: ["user@example.com"],
          source: "noreply@example.com",
        })
      ).rejects.toThrow(InternalError);
    });
  });
});
