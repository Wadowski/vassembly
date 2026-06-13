import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InternalError } from "@vassembly/errors";
import * as configModule from "@vassembly/package-config";

import { sendResetPasswordEmail } from ".";

const { mockAwsSesClient } = vi.hoisted(() => ({
  mockAwsSesClient: vi.fn(),
}));

vi.mock("@vassembly/client-aws-ses", () => ({
  AwsSesClient: mockAwsSesClient,
}));

vi.mock("@vassembly/package-config", () => ({
  config: {
    aws: {
      ses: {
        fromEmail: "noreply@example.com",
        passwordResetTemplateName: "reset-password",
      },
    },
  },
}));

describe("sendResetPasswordEmail", () => {
  let mockSendEmail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail = vi.fn().mockResolvedValue(undefined);

    mockAwsSesClient.mockReturnValue({
      sendEmail: mockSendEmail,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("sends email with correct parameters", async () => {
    await sendResetPasswordEmail({
      to: "user@example.com",
      resetUrl: "https://example.com/reset?token=123",
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith({
      templateName: "reset-password",
      recipients: ["user@example.com"],
      source: "noreply@example.com",
      templateData: { resetUrl: "https://example.com/reset?token=123" },
    });
  });

  it("throws InternalError in production when fromEmail is not configured", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    configModule.config.aws.ses.fromEmail = "";

    try {
      await expect(
        sendResetPasswordEmail({
          to: "user@example.com",
          resetUrl: "https://example.com/reset?token=123",
        }),
      ).rejects.toThrow(InternalError);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("returns early in development when fromEmail is not configured", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    configModule.config.aws.ses.fromEmail = "";

    try {
      await sendResetPasswordEmail({
        to: "user@example.com",
        resetUrl: "https://example.com/reset?token=123",
      });

      expect(mockSendEmail).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("throws InternalError in production on send failure", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new Error("SES service error");
    mockSendEmail.mockRejectedValueOnce(error);

    try {
      await expect(
        sendResetPasswordEmail({
          to: "user@example.com",
          resetUrl: "https://example.com/reset?token=123",
        }),
      ).rejects.toThrow(InternalError);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("catches error and returns in development on send failure", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    mockSendEmail.mockRejectedValueOnce(new Error("SES service error"));

    try {
      await sendResetPasswordEmail({
        to: "user@example.com",
        resetUrl: "https://example.com/reset?token=123",
      });

      expect(mockSendEmail).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
