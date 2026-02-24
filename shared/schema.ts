import { pgTable, serial, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const urlAnalysisRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export interface ModelTokenSummary {
  model: string;
  provider: string;
  tokensRaw: number;
  tokensCleaned: number;
  estimatedInputCostRaw: number;
  estimatedInputCostCleaned: number;
}

export const analyzedUrls = pgTable("analyzed_urls", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  pageTitle: text("page_title"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
  rawHtmlLength: integer("raw_html_length"),
  cleanedTextLength: integer("cleaned_text_length"),
  totalHtmlBytes: integer("total_html_bytes"),
  textBytes: integer("text_bytes"),
  scriptBytes: integer("script_bytes"),
  structureScore: integer("structure_score"),
  readabilityScore: real("readability_score"),
  modelEstimates: jsonb("model_estimates").$type<ModelTokenSummary[]>(),
  flagged: integer("flagged").default(0).notNull(),
});

export const insertAnalyzedUrlSchema = createInsertSchema(analyzedUrls).omit({ id: true, analyzedAt: true });
export type InsertAnalyzedUrl = z.infer<typeof insertAnalyzedUrlSchema>;
export type AnalyzedUrl = typeof analyzedUrls.$inferSelect;

export type UrlAnalysisRequest = z.infer<typeof urlAnalysisRequestSchema>;

export interface ModelTokenEstimate {
  model: string;
  provider: string;
  tokensRaw: number;
  tokensCleaned: number;
  costPerMillionInput: number;
  costPerMillionOutput: number;
  estimatedInputCostRaw: number;
  estimatedInputCostCleaned: number;
  contextWindow: number;
  fitsInContext: boolean;
  isExact: boolean;
}

export interface ContentBreakdown {
  totalHtmlBytes: number;
  textBytes: number;
  scriptBytes: number;
  styleBytes: number;
  markupBytes: number;
  imageCount: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  linkCount: number;
  internalLinks: number;
  externalLinks: number;
}

export interface StructureAnalysis {
  hasH1: boolean;
  headingCount: number;
  headingHierarchyValid: boolean;
  headingLevels: number[];
  hasMetaDescription: boolean;
  hasMetaTitle: boolean;
  hasOpenGraph: boolean;
  semanticElementCount: number;
  semanticElements: string[];
  nestingDepth: number;
  tableCount: number;
  formCount: number;
  iframeCount: number;
}

export interface ReadabilityMetrics {
  avgSentenceLength: number;
  avgWordLength: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readabilityScore: number;
  readabilityGrade: string;
}

export interface Recommendation {
  category: "content" | "structure" | "performance" | "accessibility";
  impact: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface AnalysisResult {
  url: string;
  fetchedAt: string;
  rawHtmlLength: number;
  cleanedTextLength: number;
  cleanedText: string;
  pageTitle: string;
  modelEstimates: ModelTokenEstimate[];
  contentBreakdown: ContentBreakdown;
  structureAnalysis: StructureAnalysis;
  readability: ReadabilityMetrics;
  recommendations: Recommendation[];
  markupToContentRatio: number;
}
