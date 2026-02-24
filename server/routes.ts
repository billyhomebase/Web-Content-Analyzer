import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeUrl } from "./analyzer";
import { urlAnalysisRequestSchema, type StructureAnalysis, type ModelTokenSummary } from "@shared/schema";
import { storage } from "./storage";

const ADULT_DOMAINS = new Set([
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com",
  "redtube.com", "youporn.com", "tube8.com", "spankbang.com",
  "beeg.com", "brazzers.com", "bangbros.com", "realitykings.com",
  "naughtyamerica.com", "mofos.com", "teamskeet.com",
  "chaturbate.com", "stripchat.com", "bongacams.com",
  "livejasmin.com", "cam4.com", "myfreecams.com",
  "onlyfans.com", "fansly.com", "manyvids.com",
  "rule34.xxx", "nhentai.net", "hentaihaven.xxx",
  "e-hentai.org", "gelbooru.com", "danbooru.donmai.us",
  "sex.com", "fuq.com", "tnaflix.com", "drtuber.com",
  "motherless.com", "eporner.com", "hclips.com",
  "txxx.com", "sunporno.com", "perfectgirls.net",
  "porntrex.com", "4tube.com", "fapvid.com",
]);

function isFlaggedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const domain of ADULT_DOMAINS) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function calcStructureScore(s: StructureAnalysis): number {
  let score = 0;
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
  return Math.min(100, score);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      const parsed = urlAnalysisRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message || "Invalid URL",
        });
      }

      const result = await analyzeUrl(parsed.data.url);

      const modelSummaries: ModelTokenSummary[] = result.modelEstimates.map((m) => ({
        model: m.model,
        provider: m.provider,
        tokensRaw: m.tokensRaw,
        tokensCleaned: m.tokensCleaned,
        estimatedInputCostRaw: m.estimatedInputCostRaw,
        estimatedInputCostCleaned: m.estimatedInputCostCleaned,
      }));

      await storage.recordAnalyzedUrl({
        url: parsed.data.url,
        pageTitle: result.pageTitle || null,
        rawHtmlLength: result.rawHtmlLength,
        cleanedTextLength: result.cleanedTextLength,
        totalHtmlBytes: result.contentBreakdown.totalHtmlBytes,
        textBytes: result.contentBreakdown.textBytes,
        scriptBytes: result.contentBreakdown.scriptBytes,
        structureScore: calcStructureScore(result.structureAnalysis),
        readabilityScore: result.readability.readabilityScore,
        modelEstimates: modelSummaries,
        flagged: isFlaggedDomain(parsed.data.url) ? 1 : 0,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        message: err.message || "Failed to analyze URL",
      });
    }
  });

  app.get("/api/history", async (_req, res) => {
    try {
      const [urls, totalCount] = await Promise.all([
        storage.getRecentUrls(50),
        storage.getTotalCount(),
      ]);
      res.json({ urls, totalCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch history" });
    }
  });

  app.get("/api/history/count", async (_req, res) => {
    try {
      const totalCount = await storage.getTotalCount();
      res.json({ totalCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch count" });
    }
  });

  app.get("/api/averages", async (_req, res) => {
    try {
      const averages = await storage.getRunningAverages();
      res.json(averages);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch averages" });
    }
  });

  return httpServer;
}
