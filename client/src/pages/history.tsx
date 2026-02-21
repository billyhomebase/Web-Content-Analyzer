import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyzedUrl, ModelTokenSummary } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Zap, ArrowLeft, History as HistoryIcon, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

interface HistoryResponse {
  urls: AnalyzedUrl[];
  totalCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCost(cost: number): string {
  if (cost < 0.001) return `<$0.001`;
  return `$${cost.toFixed(4)}`;
}

function HistoryRow({ entry }: { entry: AnalyzedUrl }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetrics = entry.rawHtmlLength != null;
  const models = (entry.modelEstimates ?? []) as ModelTokenSummary[];

  return (
    <div data-testid={`row-url-${entry.id}`}>
      <div
        className={`px-5 py-3 flex items-center justify-between gap-4 ${hasMetrics ? "cursor-pointer hover:bg-muted/50" : ""}`}
        onClick={() => hasMetrics && setExpanded(!expanded)}
        data-testid={`toggle-row-${entry.id}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
              data-testid={`link-url-${entry.id}`}
            >
              {entry.url}
            </a>
            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </div>
          {entry.pageTitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {entry.pageTitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums" data-testid={`text-timestamp-${entry.id}`}>
            {new Date(entry.analyzedAt).toLocaleString()}
          </span>
          {hasMetrics && (
            expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && hasMetrics && (
        <div className="px-5 pb-4 space-y-4" data-testid={`details-${entry.id}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Raw HTML" value={formatBytes(entry.rawHtmlLength!)} sub={`${entry.rawHtmlLength!.toLocaleString()} chars`} />
            <MetricCard label="Clean Text" value={formatBytes(entry.cleanedTextLength!)} sub={`${entry.cleanedTextLength!.toLocaleString()} chars`} />
            <MetricCard label="Structure Score" value={`${entry.structureScore ?? 0}/100`} />
            <MetricCard label="Readability" value={`${(entry.readabilityScore ?? 0).toFixed(1)}`} sub="Flesch score" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Total HTML" value={formatBytes(entry.totalHtmlBytes!)} />
            <MetricCard label="Text Content" value={formatBytes(entry.textBytes!)} />
            <MetricCard label="Scripts" value={formatBytes(entry.scriptBytes!)} />
          </div>

          {models.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Token Estimates by Model</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5 pr-3 font-medium">Model</th>
                      <th className="text-right py-1.5 px-3 font-medium">Raw Tokens</th>
                      <th className="text-right py-1.5 px-3 font-medium">Clean Tokens</th>
                      <th className="text-right py-1.5 px-3 font-medium">Cost (Raw)</th>
                      <th className="text-right py-1.5 pl-3 font-medium">Cost (Clean)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.model} className="border-b last:border-0">
                        <td className="py-1.5 pr-3">
                          <span className="font-medium">{m.model}</span>
                          <span className="text-muted-foreground ml-1">({m.provider})</span>
                        </td>
                        <td className="text-right py-1.5 px-3 tabular-nums">{m.tokensRaw.toLocaleString()}</td>
                        <td className="text-right py-1.5 px-3 tabular-nums">{m.tokensCleaned.toLocaleString()}</td>
                        <td className="text-right py-1.5 px-3 tabular-nums">{formatCost(m.estimatedInputCostRaw)}</td>
                        <td className="text-right py-1.5 pl-3 tabular-nums">{formatCost(m.estimatedInputCostCleaned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 rounded-md p-2.5">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function History() {
  const historyQuery = useQuery<HistoryResponse>({
    queryKey: ["/api/history"],
  });

  const { urls = [], totalCount = 0 } = historyQuery.data ?? {};

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Analysis History
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalCount} total page{totalCount !== 1 ? "s" : ""} analyzed
              </p>
            </div>
          </div>
          <Link href="/" data-testid="link-back">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Back to Analyzer
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {historyQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-md border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        )}

        {!historyQuery.isLoading && urls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted mb-4">
              <HistoryIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-history">
              No analysis history yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              URLs will appear here after you analyze them.
            </p>
          </div>
        )}

        {urls.length > 0 && (
          <Card className="divide-y" data-testid="section-history">
            <div className="px-5 py-3 flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>URL</span>
              <span>Analyzed</span>
            </div>
            {urls.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </Card>
        )}

        {urls.length > 0 && urls.length < totalCount && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing most recent {urls.length} of {totalCount} total analyses
          </p>
        )}
      </main>
    </div>
  );
}
