import { useQuery } from "@tanstack/react-query";
import type { AnalyzedUrl } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Zap, ArrowLeft, History as HistoryIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface HistoryResponse {
  urls: AnalyzedUrl[];
  totalCount: number;
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
              <div
                key={entry.id}
                className="px-5 py-3 flex items-center justify-between gap-4"
                data-testid={`row-url-${entry.id}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate"
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
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums" data-testid={`text-timestamp-${entry.id}`}>
                  {new Date(entry.analyzedAt).toLocaleString()}
                </span>
              </div>
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
