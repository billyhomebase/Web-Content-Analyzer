import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@shared/schema";
import { FileText, Code, Hash, ExternalLink } from "lucide-react";

interface TokenOverviewProps {
  result: AnalysisResult;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function TokenOverview({ result }: TokenOverviewProps) {
  const avgTokensRaw = Math.round(
    result.modelEstimates.reduce((sum, m) => sum + m.tokensRaw, 0) /
      result.modelEstimates.length
  );
  const avgTokensCleaned = Math.round(
    result.modelEstimates.reduce((sum, m) => sum + m.tokensCleaned, 0) /
      result.modelEstimates.length
  );

  const stats = [
    {
      label: "Raw HTML Size",
      value: formatBytes(result.rawHtmlLength),
      sub: `${formatNumber(avgTokensRaw)} avg tokens`,
      icon: Code,
    },
    {
      label: "Clean Text Size",
      value: formatBytes(result.cleanedTextLength),
      sub: `${formatNumber(avgTokensCleaned)} avg tokens`,
      icon: FileText,
    },
    {
      label: "Markup Ratio",
      value: `${result.markupToContentRatio.toFixed(1)}x`,
      sub: "markup vs content",
      icon: Hash,
    },
    {
      label: "Page Title",
      value: result.pageTitle || "None",
      sub: new URL(result.url).hostname,
      icon: ExternalLink,
      isTitle: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="section-overview">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {stat.label}
            </span>
            <stat.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div
            className={`font-semibold mb-1 ${stat.isTitle ? "text-sm truncate" : "text-2xl tabular-nums"}`}
            data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {stat.value}
          </div>
          <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
        </Card>
      ))}
    </div>
  );
}
