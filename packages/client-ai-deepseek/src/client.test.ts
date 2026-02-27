import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepseekAiClient } from "./client";
import OpenAI from "openai";

vi.mock("openai");

describe("DeepseekAiClient", () => {
  const mockApiKey = "test-api-key";
  const mockBaseURL = "https://api.deepseek.com";
  let mockAiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAiClient = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };
    vi.mocked(OpenAI).mockImplementation(() => mockAiClient);
  });

  describe("initialization", () => {
    it("should create a client with the provided API key", () => {
      const client = DeepseekAiClient({ apiKey: mockApiKey, baseURL: mockBaseURL });
      expect(client).toBeDefined();
      expect(client.chat).toBeDefined();
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: mockApiKey,
        baseURL: mockBaseURL,
      });
    });
  });

  describe("chat", () => {
    it("should send a message and return the response", async () => {
      const client = DeepseekAiClient({ apiKey: mockApiKey, baseURL: mockBaseURL });
      const userMessage = "Hello, Deepseek!";
      const responseContent = "Hello! How can I help you?";

      mockAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: responseContent,
            },
          },
        ],
      });

      const result = await client.chat({ userMessage });
      expect(result.message).toBe(responseContent);
      expect(mockAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });
    });

    it("should include system message when provided", async () => {
      const client = DeepseekAiClient({ apiKey: mockApiKey, baseURL: mockBaseURL });
      const systemMessage = "You are a helpful assistant.";
      const userMessage = "What is the weather?";
      const responseContent = "I don't have access to real-time weather data.";

      mockAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: responseContent,
            },
          },
        ],
      });

      const result = await client.chat({ systemMessage, userMessage });
      expect(result.message).toBe(responseContent);
      expect(mockAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: userMessage,
          },
          {
            role: "system",
            content: systemMessage,
          },
        ],
      });
    });

    it("should handle empty message content gracefully", async () => {
      const client = DeepseekAiClient({ apiKey: mockApiKey, baseURL: mockBaseURL });
      const userMessage = "test message";

      mockAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await client.chat({ userMessage });
      expect(result.message).toBe("");
    });

    it("should handle API errors", async () => {
      const client = DeepseekAiClient({ apiKey: mockApiKey, baseURL: mockBaseURL });
      const userMessage = "test message";
      const error = new Error("API Error");

      mockAiClient.chat.completions.create.mockRejectedValueOnce(error);

      await expect(client.chat({ userMessage })).rejects.toThrow("API Error");
    });
  });
});
