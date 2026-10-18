import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import "dotenv/config";
import { InvoiceSchema } from "./invoice-schema";

// ---------- Configuration ----------
// Application safety limit. NOT Groq's real maximum (131,072 tokens).
// Configurable via .env (MAX_INPUT_TOKENS=8000), defaults to 8,000.
const MAX_INPUT_TOKENS = Number(process.env.MAX_INPUT_TOKENS) || 8_000;

// Rough rule of thumb for English text: ~4 characters per token.
const CHARS_PER_TOKEN = 4;

// ---------- Groq client ----------
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 30_000,
  maxRetries: 0,
});

// ---------- Schema ----------
// const InvoiceSchema = z.object({
//   invoiceNumber: z.string(),
//   customerName: z.string(),
//   total: z.number(),
//   currency: z.enum(["PKR", "USD", "EUR"]),
// });

// ---------- Token estimation ----------
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ---------- Main ----------
async function main() {
  console.log("Starting invoice extraction...");

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing. Check your .env file.");
    }

    const invoiceText = [
      "Invoice number: INV-104",
      "Customer: Ali Khan",
      "Total: 5000 PKR",
    ].join("\n");

    const prompt = `Extract invoice details from this text.\n${invoiceText}`;

    // Check size BEFORE calling the API
    const estimatedTokens = estimateTokens(prompt);
    console.log(`Estimated input tokens: ~${estimatedTokens} (limit: ${MAX_INPUT_TOKENS})`);

    if (estimatedTokens > MAX_INPUT_TOKENS) {
      throw new Error(
        `Input too large: ~${estimatedTokens} estimated tokens exceeds the limit of ${MAX_INPUT_TOKENS}. Shorten the invoice text.`
      );
    }

    console.log("Sending request to Groq...");
    const startTime = Date.now();

    const response = await client.responses.parse({
      model: "openai/gpt-oss-20b",
      input: prompt,
      text: {
        format: zodTextFormat(InvoiceSchema, "invoice"),
      },
    });

    const latencyMs = Date.now() - startTime;
    console.log("Latency:", latencyMs, "ms");
    console.log("Token usage:", response.usage);

    if (response.status !== "completed") {
      throw new Error(`Response not completed. Status: ${response.status}`);
    }

    const invoice = response.output_parsed;
    if (!invoice) {
      throw new Error("No parsed output returned by the model.");
    }

    const validated = InvoiceSchema.parse(invoice);
    console.log("Extracted invoice:", validated);
  } catch (error) {
    console.error("Request failed:", error instanceof Error ? error.message : error);
  }
}

main();