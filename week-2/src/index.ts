
import "dotenv/config";
import Groq from "groq-sdk";
import { z } from "zod";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
    WeatherSchema,
    QuerySchema,
    fetchWeather,
    queryDatabase,
} from "./week2-tools.js";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env");
}

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const MAX_ITERATIONS = 5;

const groq = new Groq({ apiKey });

const toolDefinitions = [
    {
        type: "function" as const,
        function: {
            name: "fetchWeather",
            description:
                "Get example weather data for a city. The data is mocked, not live.",
            parameters: {
                type: "object",
                properties: {
                    city: {
                        type: "string",
                        description: "City name, for example Peshawar",
                    },
                },
                required: ["city"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "queryDatabase",
            description:
                "Retrieve example student records from the mock students table.",
            parameters: {
                type: "object",
                properties: {
                    table: {
                        type: "string",
                        enum: ["students"],
                    },
                    limit: {
                        type: "integer",
                        minimum: 1,
                        maximum: 100,
                        description: "Maximum records to return",
                    },
                },
                required: ["table"],
                additionalProperties: false,
            },
        },
    },
];

type ToolResult =
    | { ok: true; data: unknown }
    | { ok: false; error: string };

async function dispatchTool(
    toolName: string,
    rawArgs: unknown,
): Promise<ToolResult> {
    try {
        if (toolName === "fetchWeather") {
            const parsed = WeatherSchema.safeParse(rawArgs);

            if (!parsed.success) {
                return { ok: false, error: "Invalid weather arguments" };
            }

            const data = await fetchWeather(parsed.data);
            return { ok: true, data };
        }

        if (toolName === "queryDatabase") {
            const parsed = QuerySchema.safeParse(rawArgs);

            if (!parsed.success) {
                return { ok: false, error: "Invalid database arguments" };
            }

            const data = await queryDatabase(parsed.data);
            return { ok: true, data };
        }

        return { ok: false, error: "Unknown tool" };
    } catch (error) {
        // Log details locally; return a safe message to the model.
        console.error("Tool execution failed:", error);
        return { ok: false, error: "Tool execution failed" };
    }
}

async function askAssistant(userPrompt: string): Promise<string> {
    // `any[]` here keeps the mixed chat/tool message history easy to follow.
    const messages: any[] = [
        {
            role: "system",
            content:
                "You are a helpful CLI assistant. Use the provided tools when needed. " +
                "Never claim mock weather or mock database results are real. " +
                "If a tool returns an error, explain that honestly.",
        },
        { role: "user", content: userPrompt },
    ];

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages,
            tools: toolDefinitions,
            tool_choice: "auto",
        });

        const assistantMessage = response.choices[0]?.message;
        if (!assistantMessage) {
            throw new Error("Groq returned no assistant message");
        }

        // Keep the assistant's tool-call message in conversation history.
        messages.push(assistantMessage);

        const toolCalls = assistantMessage.tool_calls;

        // No tool calls means the model has produced its final answer.
        if (!toolCalls?.length) {
            return assistantMessage.content ?? "(No text response returned)";
        }

        // These calls are independent in this demo, so run them concurrently.
        const results = await Promise.all(
            toolCalls.map(async (toolCall) => {
                let result: ToolResult;

                try {
                    const args: unknown = JSON.parse(
                        toolCall.function.arguments,
                    );

                    result = await dispatchTool(
                        toolCall.function.name,
                        args,
                    );
                } catch {
                    result = {
                        ok: false,
                        error: "Tool arguments were not valid JSON",
                    };
                }

                return {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                };
            }),
        );

        // Each result must be linked to its original tool call ID.
        messages.push(...results);
    }

    return "I reached the tool-call limit. Please try a simpler request.";
}

async function main() {
    const rl = createInterface({ input, output });

    console.log("Week 2 CLI Assistant");
    console.log("Tools: fetchWeather, queryDatabase");
    console.log("Type 'exit' to quit.\n");

    try {
        while (true) {
            const prompt = await rl.question("You: ");
            const trimmed = prompt.trim();

            if (trimmed.toLowerCase() === "exit") {
                break;
            }

            if (!trimmed) {
                continue;
            }

            try {
                const answer = await askAssistant(trimmed);
                console.log(`\nAssistant: ${answer}\n`);
            } catch (error) {
                console.error(
                    "Request failed:",
                    error instanceof Error ? error.message : "Unknown error",
                );
            }
        }
    } finally {
        rl.close();
    }
}

main().catch((error) => {
    console.error("Application failed:", error);
    process.exitCode = 1;
});
