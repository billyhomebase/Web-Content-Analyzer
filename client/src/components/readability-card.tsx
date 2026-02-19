import { Card } from "@/components/ui/card";
import type { ReadabilityMetrics } from "@shared/schema";

interface ReadabilityCardProps {
  readability: ReadabilityMetrics;
}

function getGradeColor(grade: string): string {
  if (grade.includes("Easy") || grade.includes("5th") || grade.includes("6th"))
    return "text-chart-2";
  if (grade.includes("Standard") || grade.includes("7th") || grade.includes("8th"))
    return "text-chart-4";
  return "text-chart-5";
}

export function ReadabilityCard({ readability }: ReadabilityCardProps) {
  const metrics = [
    { label: "Words", value: readability.wordCount.toLocaleString() },
    { label: "Sentences", value: readability.sentenceCount.toLocaleString() },
    { label: "Paragraphs", value: readability.paragraphCount.toLocaleString() },
    {
      label: "Avg Sentence Length",
      value: `${readability.avgSentenceLength.toFixed(1)} words`,
    },
    {
      label: "Avg Word Length",
      value: `${readability.avgWordLength.toFixed(1)} chars`,
    },
  ];

  return (
    <Card className="p-5" data-testid="section-readability">
      <h3 className="text-sm font-semibold mb-4">Readability</h3>

      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted">
          <span
            className={`text-xl font-bold tabular-nums ${getGradeColor(readability.readabilityGrade)}`}
          >
            {readability.readabilityScore.toFixed(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{readability.readabilityGrade}</p>
          <p className="text-xs text-muted-foreground">
            Flesch Reading Ease Score
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <span className="text-sm font-medium tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
