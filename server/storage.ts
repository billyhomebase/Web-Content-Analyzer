import { db } from "./db";
import { analyzedUrls, type InsertAnalyzedUrl, type AnalyzedUrl } from "@shared/schema";
import { desc, count } from "drizzle-orm";

export interface IStorage {
  recordAnalyzedUrl(data: InsertAnalyzedUrl): Promise<AnalyzedUrl>;
  getRecentUrls(limit: number): Promise<AnalyzedUrl[]>;
  getTotalCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async recordAnalyzedUrl(data: InsertAnalyzedUrl): Promise<AnalyzedUrl> {
    const [row] = await db.insert(analyzedUrls).values(data).returning();
    return row;
  }

  async getRecentUrls(limit: number): Promise<AnalyzedUrl[]> {
    return db.select().from(analyzedUrls).orderBy(desc(analyzedUrls.analyzedAt)).limit(limit);
  }

  async getTotalCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(analyzedUrls);
    return result.value;
  }
}

export const storage = new DatabaseStorage();
