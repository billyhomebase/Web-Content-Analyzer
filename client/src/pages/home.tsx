import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AnalysisResult } from "@shared/schema";
import { UrlInput } from "@/components/url-input";
import { TokenOverview } from "@/components/token-overview";
import { ModelComparison } from "@/components/model-comparison";
import { ContentBreakdownChart } from "@/components/content-breakdown-chart";
import { StructureScore } from "@/components/structure-score";
import { ReadabilityCard } from "@/components/readability-card";
import { Recommendations } from "@/components/recommendations";
import { Methodology } from "@/components/methodology";
import { Zap, BarChart3, FileText, History } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const queryClient = useQueryClient();

  const countQuery = useQuery<{ totalCount: number }>({
    queryKey: ["/api/history/count"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/analyze", { url });
      return (await res.json()) as AnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/history/count"] });
    },
  });

  const totalCount = countQuery.data?.totalCount ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight" data-testid="text-app-title">
                AI Token Analyzer
              </h1>
              <p className="text-sm text-muted-foreground">
                Estimate AI processing costs for any web page
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground tabular-nums" data-testid="text-total-count">
              {totalCount} page{totalCount !== 1 ? "s" : ""} analyzed
            </span>
            <Link href="/history" data-testid="link-history">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer">
                <History className="w-4 h-4" />
                History
              </span>
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            Built by Billy Hanna{" "}
            <a
              href="https://www.linkedin.com/in/billyhanna/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-author"
            >
              https://www.linkedin.com/in/billyhanna/
            </a>
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <UrlInput
            onSubmit={(url) => analyzeMutation.mutate(url)}
            isLoading={analyzeMutation.isPending}
            error={analyzeMutation.error?.message}
          />
        </div>

        {!result && !analyzeMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted">
                <Zap className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-md bg-muted">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-title">
              Enter a URL to get started
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Analyze any web page to see token estimates across AI models,
              content breakdown, and optimization recommendations.
            </p>
          </div>
        )}

        {analyzeMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 rounded-md border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-muted-foreground" data-testid="text-loading">
              Fetching and analyzing page content...
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6" data-testid="section-results">
            <TokenOverview result={result} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentBreakdownChart breakdown={result.contentBreakdown} />
              <StructureScore structure={result.structureAnalysis} />
            </div>

            <ModelComparison estimates={result.modelEstimates} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReadabilityCard readability={result.readability} />
              <Recommendations recommendations={result.recommendations} />
            </div>

            <Methodology />
          </div>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            OpenAI token counts are exact via tiktoken. Other model estimates are approximate.
          </p>
        </div>
      </footer>
    </div>
  );
}
