import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import dotenv from "dotenv";
import { environment } from "../utils/config";
import { tools } from "../utils/agent.tools";

dotenv.config();

const openAIApiKey = environment.OPENAI_API_KEY!;
const llm = new ChatOpenAI({
  model: "gpt-4o", // Must support vision!
  apiKey: openAIApiKey,
});

const chatHistory: Record<string, BaseMessage[]> = {};

export async function runAIAgent({
  userPrompt,
  userAddress,
  imageBase64,
}: {
  userPrompt: string;
  userAddress: string;
  imageBase64?: string; // Optional image input
}) {
  const systemPrompt = new SystemMessage(
    `You are AgriShield, an AI agent that helps users with agricultural insurance queries and transactions. You can provide information about available insurance plans, assist with payments, and answer general questions related to agriculture and insurance. Always be helpful, concise, and professional.`
  );

  const llmWithTools = llm.bind({ tools });

  // Determine input format
  const userMessage = imageBase64
    ? new HumanMessage({
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: userPrompt,
          },
        ],
      })
    : new HumanMessage(userPrompt);

  if (!chatHistory[userAddress]) {
    chatHistory[userAddress] = [];
  }

  chatHistory[userAddress].push(userMessage);
  const messages = [systemPrompt, ...chatHistory[userAddress]];

  // Invoke the AI agent
  const aiMessage = await llmWithTools.invoke(messages);
  chatHistory[userAddress].push(aiMessage);

  if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
    aiMessage.tool_calls.forEach((toolCall) => {
      const message = new ToolMessage({
        content: toolCall.name,
        tool_call_id: toolCall.id!,
      });
      chatHistory[userAddress].push(message);
    });
  }

  return {
    content: aiMessage.content,
    tool_calls: aiMessage.tool_calls,
  };
}
