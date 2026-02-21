import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeUrl } from "./analyzer";
import { urlAnalysisRequestSchema } from "@shared/schema";
import { storage } from "./storage";

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

      await storage.recordAnalyzedUrl({
        url: parsed.data.url,
        pageTitle: result.pageTitle || null,
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

  return httpServer;
}
