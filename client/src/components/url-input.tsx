import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle } from "lucide-react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string;
}

export function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let normalizedUrl = url.trim();
    if (normalizedUrl && !normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    if (normalizedUrl) {
      onSubmit(normalizedUrl);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter a URL to analyze (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10"
              disabled={isLoading}
              data-testid="input-url"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            data-testid="button-analyze"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive" data-testid="text-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </Card>
  );
}
