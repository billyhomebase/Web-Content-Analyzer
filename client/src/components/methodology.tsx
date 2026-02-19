import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CircleCheck, CircleDashed, BookOpen } from "lucide-react";

export function Methodology() {
  return (
    <Card className="p-5" data-testid="section-methodology">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Calculation Methodology</h3>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Token Counting</h4>
          <p>
            This tool uses two methods to estimate token counts depending on the model:
          </p>
          <ul className="mt-2 space-y-2">
            <li className="flex gap-2">
              <CircleCheck className="w-4 h-4 text-chart-2 flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-medium text-foreground">Exact (OpenAI models)</span> — Uses
                OpenAI's official <span className="font-mono text-xs">tiktoken</span> tokenizer library
                (cl100k_base / o200k_base encoding). This runs locally and produces the
                same token count that OpenAI's API would use. No API calls are made.
              </span>
            </li>
            <li className="flex gap-2">
              <CircleDashed className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-medium text-foreground">Approximate (other models)</span> — Uses
                a character-to-token ratio specific to each provider. For example, Claude models
                average ~3.5 characters per token, while Gemini averages ~4.2. The text length is
                divided by this ratio. These estimates are typically within 10–20% of the actual count.
              </span>
            </li>
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Cost Estimation</h4>
          <p>
            Costs are calculated using each model's published input token pricing. The formula is:
          </p>
          <p className="font-mono text-xs bg-muted px-3 py-2 rounded-md mt-2">
            cost = (token_count / 1,000,000) × price_per_million_input_tokens
          </p>
          <p className="mt-2">
            Only input (prompt) costs are shown — output costs depend on how much
            the model generates in response, which varies by use case. Pricing
            reflects publicly available rates and may change over time.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Content Analysis</h4>
          <p>
            The tool fetches the page HTML and analyzes it in two forms:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>
              <span className="font-medium text-foreground">Raw HTML</span> — The complete page source
              including all markup, scripts, and styles. This represents the worst-case
              scenario if you feed the entire page to an AI.
            </li>
            <li>
              <span className="font-medium text-foreground">Cleaned Text</span> — Text content only,
              with all HTML tags, scripts, styles, and excess whitespace stripped.
              This represents the best-case after preprocessing.
            </li>
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Readability Score</h4>
          <p>
            Uses the Flesch Reading Ease formula, which measures text complexity based on
            average sentence length and syllable count. Scores range from 0 (very difficult)
            to 100 (very easy). Simpler text generally results in more efficient AI processing.
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Structure Score</h4>
          <p>
            A composite score (0–100) evaluating how well the page is structured for AI
            comprehension. It checks for proper heading hierarchy, semantic HTML elements
            (nav, main, article, etc.), meta tags, and reasonable DOM nesting depth.
            Well-structured pages help AI models understand content context and importance.
          </p>
        </div>
      </div>
    </Card>
  );
}
