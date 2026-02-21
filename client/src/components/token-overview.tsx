import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@shared/schema";
import { FileText, Code, Hash, ExternalLink, TrendingUp } from "lucide-react";

interface RunningAverages {
  avgTokensRaw: number;
  avgTokensCleaned: number;
  avgMarkupRatio: number;
  totalAnalyzed: number;
}

interface TokenOverviewProps {
  result: AnalysisResult;
  runningAverages?: RunningAverages;
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

export function TokenOverview({ result, runningAverages }: TokenOverviewProps) {
  const avgTokensRaw = Math.round(
    result.modelEstimates.reduce((sum, m) => sum + m.tokensRaw, 0) /
      result.modelEstimates.length,
  );
  const avgTokensCleaned = Math.round(
    result.modelEstimates.reduce((sum, m) => sum + m.tokensCleaned, 0) /
      result.modelEstimates.length,
  );

  const stats = [
    {
      label: "Raw HTML Size",
      value: formatBytes(result.rawHtmlLength),
      subNode: (
        <>
          <span className="font-semibold">{formatNumber(avgTokensRaw)}</span> average tokens required for an LLM to process the HTML
          {runningAverages && runningAverages.totalAnalyzed > 0 && (
            <span className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70" data-testid="text-avg-raw">
              <TrendingUp className="w-3 h-3" />
              Running avg: {formatNumber(runningAverages.avgTokensRaw)} tokens across {runningAverages.totalAnalyzed} pages
            </span>
          )}
        </>
      ),
      icon: Code,
    },
    {
      label: "Clean Text Size",
      value: formatBytes(result.cleanedTextLength),
      subNode: (
        <>
          <span className="font-semibold">{formatNumber(avgTokensCleaned)}</span> average tokens required for an LLM to process the text
          {runningAverages && runningAverages.totalAnalyzed > 0 && (
            <span className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70" data-testid="text-avg-clean">
              <TrendingUp className="w-3 h-3" />
              Running avg: {formatNumber(runningAverages.avgTokensCleaned)} tokens across {runningAverages.totalAnalyzed} pages
            </span>
          )}
        </>
      ),
      icon: FileText,
    },
    {
      label: "Markup Ratio",
      value: `${result.markupToContentRatio.toFixed(1)}x`,
      subNode: (
        <>
          markup vs content
          {runningAverages && runningAverages.totalAnalyzed > 0 && (
            <span className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70" data-testid="text-avg-markup">
              <TrendingUp className="w-3 h-3" />
              Running avg: {runningAverages.avgMarkupRatio}x across {runningAverages.totalAnalyzed} pages
            </span>
          )}
        </>
      ),
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
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="section-overview"
    >
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {stat.label}
            </span>
            <stat.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div
            className={`font-semibold mb-1 ${stat.isTitle ? "text-sm truncate" : "text-lg tabular-nums"}`}
            data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {stat.value}
          </div>
          <p className="text-sm text-muted-foreground">{"subNode" in stat ? stat.subNode : stat.sub}</p>
        </Card>
      ))}
    </div>
  );
}
