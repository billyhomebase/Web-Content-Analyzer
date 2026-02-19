import { Card } from "@/components/ui/card";
import type { ContentBreakdown } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ContentBreakdownChartProps {
  breakdown: ContentBreakdown;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(173, 58%, 39%)",
  "hsl(43, 74%, 49%)",
  "hsl(27, 87%, 67%)",
];

export function ContentBreakdownChart({
  breakdown,
}: ContentBreakdownChartProps) {
  const data = [
    { name: "Text Content", value: breakdown.textBytes },
    { name: "Scripts", value: breakdown.scriptBytes },
    { name: "Styles", value: breakdown.styleBytes },
    { name: "HTML Markup", value: breakdown.markupBytes },
  ].filter((d) => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="p-5" data-testid="section-content-breakdown">
      <h3 className="text-sm font-semibold mb-4">Content Composition</h3>
      <div className="flex items-center gap-6">
        <div className="w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatBytes(value)}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                  <span className="text-sm tabular-nums font-medium w-16 text-right">
                    {formatBytes(item.value)}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Page Size</span>
            <span className="text-sm font-medium tabular-nums">
              {formatBytes(total)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Images Found</span>
            <span className="text-sm tabular-nums">
              {breakdown.imageCount} ({breakdown.imagesWithAlt} with alt text)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Links</span>
            <span className="text-sm tabular-nums">
              {breakdown.linkCount} ({breakdown.internalLinks} internal, {breakdown.externalLinks} external)
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
