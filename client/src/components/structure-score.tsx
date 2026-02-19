import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { StructureAnalysis } from "@shared/schema";
import { Check, X, Minus } from "lucide-react";

interface StructureScoreProps {
  structure: StructureAnalysis;
}

function getOverallScore(s: StructureAnalysis): number {
  let score = 0;
  const max = 100;

  if (s.hasH1) score += 15;
  if (s.headingHierarchyValid) score += 15;
  if (s.hasMetaTitle) score += 10;
  if (s.hasMetaDescription) score += 10;
  if (s.hasOpenGraph) score += 10;
  if (s.semanticElementCount > 0) score += 15;
  if (s.nestingDepth <= 15) score += 10;
  else if (s.nestingDepth <= 25) score += 5;
  if (s.iframeCount === 0) score += 5;
  score += Math.min(10, s.headingCount * 2);

  return Math.min(max, score);
}

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: "Excellent", color: "text-chart-2" };
  if (score >= 60) return { text: "Good", color: "text-chart-4" };
  if (score >= 40) return { text: "Fair", color: "text-chart-5" };
  return { text: "Needs Work", color: "text-destructive" };
}

export function StructureScore({ structure }: StructureScoreProps) {
  const score = getOverallScore(structure);
  const label = getScoreLabel(score);

  const checks = [
    { label: "Has H1 heading", pass: structure.hasH1 },
    { label: "Valid heading hierarchy", pass: structure.headingHierarchyValid },
    { label: "Meta title present", pass: structure.hasMetaTitle },
    { label: "Meta description present", pass: structure.hasMetaDescription },
    { label: "Open Graph tags", pass: structure.hasOpenGraph },
    {
      label: "Semantic HTML elements",
      pass: structure.semanticElementCount > 0,
      detail: structure.semanticElementCount > 0
        ? `${structure.semanticElementCount} found`
        : "None found",
    },
    {
      label: "Reasonable nesting depth",
      pass: structure.nestingDepth <= 15,
      detail: `${structure.nestingDepth} levels deep`,
    },
    {
      label: structure.iframeCount === 0 ? "No iframes" : `${structure.iframeCount} iframe(s) found`,
      pass: structure.iframeCount === 0,
    },
  ];

  return (
    <Card className="p-5" data-testid="section-structure">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-semibold">Page Structure</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold tabular-nums ${label.color}`}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      <Progress value={score} className="mb-4 h-2" />

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {check.pass ? (
                <Check className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              )}
              <span className="text-sm truncate">{check.label}</span>
            </div>
            {check.detail && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {check.detail}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
