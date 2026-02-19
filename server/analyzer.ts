import * as cheerio from "cheerio";
import type {
  AnalysisResult,
  ModelTokenEstimate,
  ContentBreakdown,
  StructureAnalysis,
  ReadabilityMetrics,
  Recommendation,
} from "@shared/schema";

const MODEL_CONFIGS = [
  {
    model: "GPT-4o",
    provider: "OpenAI",
    charsPerToken: 4.0,
    costPerMillionInput: 2.5,
    costPerMillionOutput: 10.0,
    contextWindow: 128_000,
  },
  {
    model: "GPT-4o mini",
    provider: "OpenAI",
    charsPerToken: 4.0,
    costPerMillionInput: 0.15,
    costPerMillionOutput: 0.6,
    contextWindow: 128_000,
  },
  {
    model: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    charsPerToken: 3.5,
    costPerMillionInput: 3.0,
    costPerMillionOutput: 15.0,
    contextWindow: 200_000,
  },
  {
    model: "Claude 3.5 Haiku",
    provider: "Anthropic",
    charsPerToken: 3.5,
    costPerMillionInput: 0.8,
    costPerMillionOutput: 4.0,
    contextWindow: 200_000,
  },
  {
    model: "Gemini 2.0 Flash",
    provider: "Google",
    charsPerToken: 4.2,
    costPerMillionInput: 0.1,
    costPerMillionOutput: 0.4,
    contextWindow: 1_000_000,
  },
  {
    model: "Gemini 1.5 Pro",
    provider: "Google",
    charsPerToken: 4.2,
    costPerMillionInput: 1.25,
    costPerMillionOutput: 5.0,
    contextWindow: 2_000_000,
  },
  {
    model: "Llama 3.1 70B",
    provider: "Meta",
    charsPerToken: 3.8,
    costPerMillionInput: 0.88,
    costPerMillionOutput: 0.88,
    contextWindow: 128_000,
  },
  {
    model: "Mistral Large",
    provider: "Mistral",
    charsPerToken: 3.9,
    costPerMillionInput: 2.0,
    costPerMillionOutput: 6.0,
    contextWindow: 128_000,
  },
];

function estimateTokens(text: string, charsPerToken: number): number {
  if (!text) return 0;
  return Math.ceil(text.length / charsPerToken);
}

function getModelEstimates(
  rawHtml: string,
  cleanedText: string
): ModelTokenEstimate[] {
  return MODEL_CONFIGS.map((config) => {
    const tokensRaw = estimateTokens(rawHtml, config.charsPerToken);
    const tokensCleaned = estimateTokens(cleanedText, config.charsPerToken);
    return {
      model: config.model,
      provider: config.provider,
      tokensRaw,
      tokensCleaned,
      costPerMillionInput: config.costPerMillionInput,
      costPerMillionOutput: config.costPerMillionOutput,
      estimatedInputCostRaw:
        (tokensRaw / 1_000_000) * config.costPerMillionInput,
      estimatedInputCostCleaned:
        (tokensCleaned / 1_000_000) * config.costPerMillionInput,
      contextWindow: config.contextWindow,
      fitsInContext: tokensCleaned <= config.contextWindow,
    };
  });
}

function analyzeContent(html: string, $: cheerio.CheerioAPI, url: string): ContentBreakdown {
  let scriptBytes = 0;
  let styleBytes = 0;

  $("script").each((_, el) => {
    scriptBytes += $(el).html()?.length ?? 0;
  });
  $("style").each((_, el) => {
    styleBytes += $(el).html()?.length ?? 0;
  });

  const cloneForText = $.root().clone();
  cloneForText.find("script, style, noscript").remove();
  const textBytes = cloneForText.text().replace(/\s+/g, " ").trim().length;
  const markupBytes = Math.max(
    0,
    html.length - textBytes - scriptBytes - styleBytes
  );

  const images = $("img");
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt && alt.trim()) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  });

  const links = $("a[href]");
  let internalLinks = 0;
  let externalLinks = 0;
  let parsedHost = "";
  try {
    parsedHost = new URL(url).hostname;
  } catch {}

  links.each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      href.startsWith("http") &&
      !href.includes(parsedHost)
    ) {
      externalLinks++;
    } else {
      internalLinks++;
    }
  });

  return {
    totalHtmlBytes: html.length,
    textBytes,
    scriptBytes,
    styleBytes,
    markupBytes,
    imageCount: images.length,
    imagesWithAlt,
    imagesWithoutAlt,
    linkCount: links.length,
    internalLinks,
    externalLinks,
  };
}

function analyzeStructure($: cheerio.CheerioAPI): StructureAnalysis {
  const headingLevels: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tagName = (el as any).tagName || (el as any).name || "";
    const level = parseInt(tagName.replace(/^h/i, ""), 10);
    if (!isNaN(level)) {
      headingLevels.push(level);
    }
  });

  let hierarchyValid = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      hierarchyValid = false;
      break;
    }
  }

  const semanticTags = [
    "header",
    "footer",
    "nav",
    "main",
    "article",
    "section",
    "aside",
    "figure",
    "figcaption",
    "details",
    "summary",
    "mark",
    "time",
  ];
  const semanticElements: string[] = [];
  let semanticElementCount = 0;
  semanticTags.forEach((tag) => {
    const count = $(tag).length;
    if (count > 0) {
      semanticElements.push(tag);
      semanticElementCount += count;
    }
  });

  function getMaxDepth(el: cheerio.Cheerio<cheerio.Element>, depth: number): number {
    let max = depth;
    el.children().each((_, child) => {
      if (child.type === "tag") {
        const childDepth = getMaxDepth($(child as cheerio.Element), depth + 1);
        if (childDepth > max) max = childDepth;
      }
    });
    return max;
  }

  let nestingDepth = 0;
  try {
    nestingDepth = getMaxDepth($("body"), 0);
  } catch {
    nestingDepth = 0;
  }

  return {
    hasH1: $("h1").length > 0,
    headingCount: headingLevels.length,
    headingHierarchyValid: hierarchyValid,
    headingLevels,
    hasMetaDescription: $('meta[name="description"]').length > 0,
    hasMetaTitle: $("title").length > 0 && ($("title").text().trim().length > 0),
    hasOpenGraph: $('meta[property^="og:"]').length > 0,
    semanticElementCount,
    semanticElements,
    nestingDepth: Math.min(nestingDepth, 100),
    tableCount: $("table").length,
    formCount: $("form").length,
    iframeCount: $("iframe").length,
  };
}

function analyzeReadability(text: string): ReadabilityMetrics {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphCount = Math.max(paragraphs.length, 1);

  const avgSentenceLength = wordCount / sentenceCount;
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = wordCount > 0 ? totalChars / wordCount : 0;

  const syllableCount = words.reduce((sum, word) => {
    return sum + countSyllables(word);
  }, 0);
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

  const readabilityScore = Math.max(
    0,
    Math.min(
      100,
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord
    )
  );

  let readabilityGrade: string;
  if (readabilityScore >= 90) readabilityGrade = "Very Easy (5th Grade)";
  else if (readabilityScore >= 80) readabilityGrade = "Easy (6th Grade)";
  else if (readabilityScore >= 70) readabilityGrade = "Fairly Easy (7th Grade)";
  else if (readabilityScore >= 60) readabilityGrade = "Standard (8th-9th Grade)";
  else if (readabilityScore >= 50) readabilityGrade = "Fairly Difficult (10th-12th)";
  else if (readabilityScore >= 30) readabilityGrade = "Difficult (College)";
  else readabilityGrade = "Very Difficult (Professional)";

  return {
    avgSentenceLength,
    avgWordLength,
    wordCount,
    sentenceCount,
    paragraphCount,
    readabilityScore,
    readabilityGrade,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function generateRecommendations(
  breakdown: ContentBreakdown,
  structure: StructureAnalysis,
  readability: ReadabilityMetrics,
  markupRatio: number
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (breakdown.scriptBytes > breakdown.textBytes) {
    recs.push({
      category: "performance",
      impact: "high",
      title: "Strip scripts before AI processing",
      description:
        "This page has more JavaScript than text content. Remove all <script> tags before sending to an AI model to significantly reduce token usage and cost.",
    });
  }

  if (breakdown.styleBytes > breakdown.textBytes * 0.5) {
    recs.push({
      category: "performance",
      impact: "high",
      title: "Remove CSS before AI processing",
      description:
        "Significant CSS content detected. Strip all <style> tags and inline styles to reduce tokens without losing meaningful content.",
    });
  }

  if (markupRatio > 5) {
    recs.push({
      category: "performance",
      impact: "high",
      title: "Very high markup-to-content ratio",
      description:
        "The HTML markup is over 5x the actual text content. Extract plain text only to dramatically reduce token usage.",
    });
  } else if (markupRatio > 3) {
    recs.push({
      category: "performance",
      impact: "medium",
      title: "High markup-to-content ratio",
      description:
        "Consider extracting text content and converting to a simpler format like Markdown before sending to AI.",
    });
  }

  if (!structure.hasH1) {
    recs.push({
      category: "structure",
      impact: "medium",
      title: "Missing H1 heading",
      description:
        "No H1 heading found. Adding a clear main heading helps AI models understand the page's primary topic.",
    });
  }

  if (!structure.headingHierarchyValid) {
    recs.push({
      category: "structure",
      impact: "medium",
      title: "Fix heading hierarchy",
      description:
        "Heading levels skip levels (e.g., H1 to H3). A logical heading hierarchy helps AI models understand content structure and importance.",
    });
  }

  if (structure.semanticElementCount === 0) {
    recs.push({
      category: "structure",
      impact: "medium",
      title: "Add semantic HTML elements",
      description:
        "No semantic elements found (nav, main, article, section, etc.). Semantic HTML helps AI distinguish navigation from main content.",
    });
  }

  if (breakdown.imagesWithoutAlt > 0) {
    recs.push({
      category: "accessibility",
      impact: "medium",
      title: `Add alt text to ${breakdown.imagesWithoutAlt} image(s)`,
      description:
        "Images without alt text are invisible to AI text models. Adding descriptive alt text ensures the AI understands all visual content.",
    });
  }

  if (structure.nestingDepth > 20) {
    recs.push({
      category: "structure",
      impact: "low",
      title: "Reduce DOM nesting depth",
      description: `The page has ${structure.nestingDepth} levels of nesting. Deeply nested HTML increases token usage without adding meaning. Flatten the structure where possible.`,
    });
  }

  if (structure.iframeCount > 0) {
    recs.push({
      category: "content",
      impact: "medium",
      title: `${structure.iframeCount} iframe(s) detected`,
      description:
        "Content inside iframes is not accessible when parsing the page HTML. Consider inlining the iframe content if it's important for AI analysis.",
    });
  }

  if (!structure.hasMetaDescription) {
    recs.push({
      category: "structure",
      impact: "low",
      title: "Add meta description",
      description:
        "A meta description provides a concise summary that helps AI quickly understand the page purpose without processing all content.",
    });
  }

  if (readability.avgSentenceLength > 25) {
    recs.push({
      category: "content",
      impact: "low",
      title: "Simplify sentence structure",
      description: `Average sentence length is ${readability.avgSentenceLength.toFixed(0)} words. Shorter sentences (15-20 words) are easier for AI models to parse accurately.`,
    });
  }

  if (structure.tableCount > 3) {
    recs.push({
      category: "content",
      impact: "low",
      title: "Convert tables to structured data",
      description:
        "Multiple tables detected. Converting table data to JSON or a structured format can improve AI comprehension and reduce tokens.",
    });
  }

  return recs;
}

function extractCleanText($: cheerio.CheerioAPI): string {
  const clone = $.root().clone();
  clone.find("script, style, noscript, svg, path").remove();

  let text = clone.text();
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AITokenAnalyzer/1.0; +https://ai-token-analyzer.replit.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
    }

    html = await response.text();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds");
    }
    throw new Error(`Could not fetch URL: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const cleanedText = extractCleanText($);
  const pageTitle = $("title").first().text().trim() || "";

  const modelEstimates = getModelEstimates(html, cleanedText);
  const contentBreakdown = analyzeContent(html, $, url);
  const structureAnalysis = analyzeStructure($);
  const readability = analyzeReadability(cleanedText);

  const markupToContentRatio =
    contentBreakdown.textBytes > 0
      ? contentBreakdown.totalHtmlBytes / contentBreakdown.textBytes
      : 0;

  const recommendations = generateRecommendations(
    contentBreakdown,
    structureAnalysis,
    readability,
    markupToContentRatio
  );

  return {
    url,
    fetchedAt: new Date().toISOString(),
    rawHtmlLength: html.length,
    cleanedTextLength: cleanedText.length,
    cleanedText: cleanedText.substring(0, 500),
    pageTitle,
    modelEstimates,
    contentBreakdown,
    structureAnalysis,
    readability,
    recommendations,
    markupToContentRatio,
  };
}
