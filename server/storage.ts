import { db } from "./db";
import { pool } from "./db";
import { analyzedUrls, type InsertAnalyzedUrl, type AnalyzedUrl } from "@shared/schema";
import { desc, count } from "drizzle-orm";

export interface RunningAverages {
  avgTokensRaw: number;
  avgTokensCleaned: number;
  avgMarkupRatio: number;
  totalAnalyzed: number;
}

export interface IStorage {
  recordAnalyzedUrl(data: InsertAnalyzedUrl): Promise<AnalyzedUrl>;
  getRecentUrls(limit: number): Promise<AnalyzedUrl[]>;
  getTotalCount(): Promise<number>;
  getRunningAverages(): Promise<RunningAverages>;
}

export class DatabaseStorage implements IStorage {
  async recordAnalyzedUrl(data: InsertAnalyzedUrl): Promise<AnalyzedUrl> {
    const [row] = await db.insert(analyzedUrls).values([data]).returning();
    return row;
  }

  async getRecentUrls(limit: number): Promise<AnalyzedUrl[]> {
    return db.select().from(analyzedUrls).orderBy(desc(analyzedUrls.analyzedAt)).limit(limit);
  }

  async getTotalCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(analyzedUrls);
    return result.value;
  }

  async getRunningAverages(): Promise<RunningAverages> {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        AVG(sub.avg_raw) as avg_tokens_raw,
        AVG(sub.avg_clean) as avg_tokens_clean,
        AVG(CASE WHEN text_bytes > 0 THEN total_html_bytes::float / text_bytes ELSE NULL END) as avg_markup_ratio
      FROM (
        SELECT
          total_html_bytes,
          text_bytes,
          (SELECT AVG((elem->>'tokensRaw')::numeric) FROM jsonb_array_elements(model_estimates) elem) as avg_raw,
          (SELECT AVG((elem->>'tokensCleaned')::numeric) FROM jsonb_array_elements(model_estimates) elem) as avg_clean
        FROM analyzed_urls
        WHERE model_estimates IS NOT NULL
      ) sub
    `);
    const row = result.rows[0];
    return {
      avgTokensRaw: Math.round(parseFloat(row.avg_tokens_raw) || 0),
      avgTokensCleaned: Math.round(parseFloat(row.avg_tokens_clean) || 0),
      avgMarkupRatio: parseFloat(parseFloat(row.avg_markup_ratio || "0").toFixed(1)),
      totalAnalyzed: parseInt(row.total) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
