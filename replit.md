# AI Token Analyzer

## Overview
A web tool that analyzes any URL and estimates the AI token usage and cost across multiple LLM models. It provides content breakdown, page structure analysis, readability metrics, and actionable recommendations to optimize pages for AI consumption.

## Architecture
- **Frontend**: React + TypeScript with Vite, Shadcn UI components, Recharts for charts
- **Backend**: Express.js with API endpoints for analysis and history
- **Database**: PostgreSQL (Neon-backed) via Drizzle ORM for URL tracking history

## Key Files
- `shared/schema.ts` - Drizzle schema (analyzed_urls table) + TypeScript types/interfaces
- `server/db.ts` - Database connection pool
- `server/storage.ts` - Storage layer with IStorage interface (DatabaseStorage)
- `server/analyzer.ts` - Core analysis engine (URL fetching, HTML parsing, token estimation, recommendations)
- `server/routes.ts` - Express API routes
- `client/src/pages/home.tsx` - Main page with URL input, count display, and results
- `client/src/pages/history.tsx` - History page showing recent 50 analyzed URLs
- `client/src/components/` - UI components for each results section

## API
- `POST /api/analyze` - Accepts `{ url: string }`, returns `AnalysisResult`, records URL in database
- `GET /api/history` - Returns `{ urls: AnalyzedUrl[], totalCount: number }` (max 50 recent)
- `GET /api/history/count` - Returns `{ totalCount: number }`

## Recent Changes
- 2026-02-21: Added URL tracking with database persistence, total count on main page, history page with 50 most recent entries
- 2026-02-21: Fixed iframe detection label to show dynamic text based on count
- 2026-02-19: Initial MVP with token estimation for 8 models, content breakdown, structure scoring, readability metrics, and AI optimization recommendations
