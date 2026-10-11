

# AI Invoice Extraction — Structured Outputs

A TypeScript-based invoice extraction tool that uses an LLM through the Groq API and validates extracted data with Zod.

## Features

- Extracts invoice details into a structured format.
- Uses Zod to define and validate the invoice schema.
- Uses OpenAI SDK with the Groq API.
- Measures API response latency and reports token usage.
- Estimates input size and rejects requests that exceed a configurable safety limit.
- Tests schema validation against valid and invalid inputs.

## Tech Stack

- **TypeScript** — application logic
- **OpenAI SDK** — API integration
- **Groq API** — language model inference
- **Zod** — runtime data validation
- **dotenv** — environment variable configuration

## Extracted Invoice Fields

| Field | Type | Description |
|---|---|---|
| `invoiceNumber` | String | Invoice identifier |
| `customerName` | String | Customer's name |
| `total` | Number | Invoice total |
| `currency` | Enum | `PKR`, `USD`, or `EUR` |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
MAX_INPUT_TOKENS=8000
```

Replace the placeholder with your own Groq API key. Never commit your `.env` file or expose your API key.

### 3. Run the application

```bash
npx tsx src/index.ts
```

### 4. Run schema tests

```bash
npx tsx src/schema-test.ts
```

## Input Size Protection

The application estimates the input size before sending a request. If the estimate exceeds `MAX_INPUT_TOKENS`, it rejects the input before making the API call.

**Note:** The current token estimator uses an approximate character-to-token ratio. It is a safety heuristic, not an exact tokenizer or a guarantee that the request fits the model's context window.

## Evaluation

The project was tested with 20 repeated runs using the same simple invoice.

- Schema-valid outputs: **20/20**
- Correct outputs for the tested invoice: **20/20**
- Average latency: **approximately 721 ms**

These results represent a small initial test, not a guarantee of accuracy across different invoices. Latency and token usage can vary between runs.

## Key Learning Outcomes

- Understanding input and output token usage.
- Using structured outputs to request predictable data.
- Validating model output at runtime with Zod.
- Understanding the difference between schema validity and factual accuracy.
- Measuring latency and token usage.
- Adding a configurable input-size safety check.
- Testing valid and invalid data with `safeParse()`.

## Future Improvements

- Add more diverse invoice test cases.
- Enforce business rules such as non-empty customer names and non-negative totals.
- Improve token estimation.
- Add explicit error handling for API failures and malformed inputs.
- Track evaluation results across multiple invoices.

## Security

Keep API keys in environment variables. Do not commit `.env` to version control.

## License

This project is currently for learning and portfolio development.
