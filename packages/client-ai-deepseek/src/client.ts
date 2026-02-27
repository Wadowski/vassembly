import OpenAI from "openai";
import { ClientDeepseekAi, DeepseekAiClientParams,  } from "./types";
import { ChatCompletionMessageParam } from "openai/resources";
import { WrongParamError, InternalError } from "@vassembly/errors";

const CONSOLE_LOG_PREFIX = "client-ai-deepseek ::";

export const DeepseekAiClient = ({
  apiKey,
  baseURL,
}: DeepseekAiClientParams): ClientDeepseekAi => {
  const aiClient = new OpenAI({
    apiKey,
    baseURL,
  });

  const chat: ClientDeepseekAi["chat"] = async ({
    systemMessage,
    userMessage,
  }) => {
    if (!userMessage) {
      throw new WrongParamError(`${CONSOLE_LOG_PREFIX} user message is required`);
    }
    const messages = [
      {
        role: "user",
        content: userMessage,
      },
    ];
    if (systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage,
      });
    }

    try {
    const response = await aiClient.chat.completions.create({
      model: "deepseek-chat",
      messages: messages as ChatCompletionMessageParam[],
    });

      const { message } = response.choices[0] || {};
      return {
        message: message?.content || "",
      };
    } catch (error) {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} error on chat`, error);
    }
  };

  return {
    chat,
  };
};
