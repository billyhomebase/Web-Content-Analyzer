import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ModelTokenEstimate } from "@shared/schema";
import { Check, X } from "lucide-react";

interface ModelComparisonProps {
  estimates: ModelTokenEstimate[];
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(cost: number): string {
  if (cost < 0.001) return `<$0.001`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

function formatContext(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

function ModelTable({
  estimates,
  mode,
}: {
  estimates: ModelTokenEstimate[];
  mode: "raw" | "cleaned";
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Model</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead className="text-right">Est. Cost</TableHead>
            <TableHead className="text-right">Context Window</TableHead>
            <TableHead className="text-center">Fits</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimates.map((est) => {
            const tokens =
              mode === "raw" ? est.tokensRaw : est.tokensCleaned;
            const cost =
              mode === "raw"
                ? est.estimatedInputCostRaw
                : est.estimatedInputCostCleaned;
            const fits =
              mode === "raw"
                ? est.tokensRaw <= est.contextWindow
                : est.tokensCleaned <= est.contextWindow;

            return (
              <TableRow key={est.model} data-testid={`row-model-${est.model.toLowerCase().replace(/[\s.]/g, "-")}`}>
                <TableCell className="font-medium text-sm">
                  {est.model}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {est.provider}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatTokens(tokens)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatCost(cost)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatContext(est.contextWindow)}
                </TableCell>
                <TableCell className="text-center">
                  {fits ? (
                    <Check className="w-4 h-4 text-chart-2 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-destructive mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ModelComparison({ estimates }: ModelComparisonProps) {
  return (
    <Card className="p-5" data-testid="section-model-comparison">
      <h3 className="text-sm font-semibold mb-4">Model Token Estimates & Costs</h3>
      <Tabs defaultValue="cleaned">
        <TabsList className="mb-4">
          <TabsTrigger value="cleaned" data-testid="tab-cleaned">Cleaned Text</TabsTrigger>
          <TabsTrigger value="raw" data-testid="tab-raw">Raw HTML</TabsTrigger>
        </TabsList>
        <TabsContent value="cleaned">
          <ModelTable estimates={estimates} mode="cleaned" />
        </TabsContent>
        <TabsContent value="raw">
          <ModelTable estimates={estimates} mode="raw" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
