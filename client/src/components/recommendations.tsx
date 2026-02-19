import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@shared/schema";
import { Lightbulb, AlertTriangle, Info } from "lucide-react";

interface RecommendationsProps {
  recommendations: Recommendation[];
}

function getImpactConfig(impact: string) {
  switch (impact) {
    case "high":
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        label: "High Impact",
      };
    case "medium":
      return {
        variant: "default" as const,
        icon: Lightbulb,
        label: "Medium",
      };
    default:
      return {
        variant: "secondary" as const,
        icon: Info,
        label: "Low",
      };
  }
}

function getCategoryLabel(cat: string) {
  switch (cat) {
    case "content":
      return "Content";
    case "structure":
      return "Structure";
    case "performance":
      return "Performance";
    case "accessibility":
      return "Accessibility";
    default:
      return cat;
  }
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.impact] ?? 2) - (order[b.impact] ?? 2);
  });

  return (
    <Card className="p-5" data-testid="section-recommendations">
      <h3 className="text-sm font-semibold mb-4">
        AI Optimization Recommendations
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recommendations - this page is well-optimized for AI consumption.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((rec, i) => {
            const config = getImpactConfig(rec.impact);
            return (
              <div
                key={i}
                className="flex gap-3"
                data-testid={`card-recommendation-${i}`}
              >
                <config.icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium">{rec.title}</span>
                    <Badge variant={config.variant} className="text-[10px]">
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {getCategoryLabel(rec.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
