import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { isValidPair } from "../drugs";
import { sanitize, type Sanitized } from "./sanitize";
import { ModelOutputSchema, type AnalyzeRequest } from "./schema";
import { DEMO_CALL_1 } from "./script";

// Small, fast model by default so each line comes back in a couple of seconds.
// Override with ANTHROPIC_MODEL (for example claude-sonnet-5-5) if accuracy needs it.
const DEFAULT_MODEL = "claude-haiku-4-5";

export class AnalyzeError extends Error {}

/** Server only. Calls Claude for one line and returns a sanitized update. */
export async function analyzeLine(req: AnalyzeRequest): Promise<Sanitized> {
  if (!process.env.ANTHROPIC_API_KEY) throw new AnalyzeError("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const { drug, indication } =
    req.setup && isValidPair(req.setup.drug, req.setup.indication) ? req.setup : DEMO_CALL_1.setup;

  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 1500,
    temperature: 0,
    system: buildSystemPrompt(drug, indication),
    messages: [{ role: "user", content: buildUserMessage(req) }],
    output_config: { format: zodOutputFormat(ModelOutputSchema) },
  });

  if (response.stop_reason === "refusal") throw new AnalyzeError("The model declined this request");
  if (response.stop_reason === "max_tokens") throw new AnalyzeError("The model's answer was cut off");
  if (!response.parsed_output) throw new AnalyzeError("The model's answer did not match the schema");

  return sanitize(response.parsed_output, {
    line: req.line,
    knownEventIds: req.state.events.map((e) => e.id),
  });
}
