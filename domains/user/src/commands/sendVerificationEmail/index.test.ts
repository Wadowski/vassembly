import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InternalError } from "@vassembly/errors";
import * as configModule from "@vassembly/config";

import { sendVerificationEmail } from "./index";

const { mockAwsSesClient } = vi.hoisted(() => ({
  mockAwsSesClient: vi.fn(),
}));

vi.mock("@vassembly/client-aws-ses", () => ({
  AwsSesClient: mockAwsSesClient,
}));

vi.mock("@vassembly/config", () => ({
  config: {
    aws: {
      ses: {
        fromEmail: "noreply@example.com",
        emailVerificationTemplateName: "verify-email",
      },
    },
  },
}));

describe("sendVerificationEmail", () => {
  let mockSendEmail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail = vi.fn().mockResolvedValue(undefined);
    configModule.config.aws.ses.fromEmail = "noreply@example.com";

    mockAwsSesClient.mockReturnValue({
      sendEmail: mockSendEmail,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should send email with correct parameters", async () => {
    await sendVerificationEmail({
      to: "user@example.com",
      verificationUrl: "https://example.com/verify?token=123",
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith({
      templateName: "verify-email",
      recipients: ["user@example.com"],
      source: "noreply@example.com",
      templateData: { verificationUrl: "https://example.com/verify?token=123" },
    });
  });

  it("should throw InternalError in production when fromEmail is not configured", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    configModule.config.aws.ses.fromEmail = "";

    try {
      await expect(
        sendVerificationEmail({
          to: "user@example.com",
          verificationUrl: "https://example.com/verify?token=123",
        }),
      ).rejects.toThrow(InternalError);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("should return early in development when fromEmail is not configured", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    configModule.config.aws.ses.fromEmail = "";

    try {
      await sendVerificationEmail({
        to: "user@example.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(mockSendEmail).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("should throw InternalError in production on send failure", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    mockSendEmail.mockRejectedValueOnce(new Error("SES service error"));

    try {
      await expect(
        sendVerificationEmail({
          to: "user@example.com",
          verificationUrl: "https://example.com/verify?token=123",
        }),
      ).rejects.toThrow(InternalError);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("should catch error and return in development on send failure", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    mockSendEmail.mockRejectedValueOnce(new Error("SES service error"));

    try {
      await sendVerificationEmail({
        to: "user@example.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(mockSendEmail).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
