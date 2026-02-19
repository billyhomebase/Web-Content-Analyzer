import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeUrl } from "./analyzer";
import { urlAnalysisRequestSchema } from "@shared/schema";

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
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        message: err.message || "Failed to analyze URL",
      });
    }
  });

  return httpServer;
}
