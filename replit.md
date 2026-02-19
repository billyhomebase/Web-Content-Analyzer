# AI Token Analyzer

## Overview
A web tool that analyzes any URL and estimates the AI token usage and cost across multiple LLM models. It provides content breakdown, page structure analysis, readability metrics, and actionable recommendations to optimize pages for AI consumption.

## Architecture
- **Frontend**: React + TypeScript with Vite, Shadcn UI components, Recharts for charts
- **Backend**: Express.js with a single POST endpoint `/api/analyze`
- **No database needed** - this is a stateless analysis tool

## Key Files
- `shared/schema.ts` - TypeScript types/interfaces for analysis results
- `server/analyzer.ts` - Core analysis engine (URL fetching, HTML parsing, token estimation, recommendations)
- `server/routes.ts` - Express API route
- `client/src/pages/home.tsx` - Main page with URL input and results display
- `client/src/components/` - UI components for each results section

## API
- `POST /api/analyze` - Accepts `{ url: string }`, returns `AnalysisResult`

## Recent Changes
- 2026-02-19: Initial MVP with token estimation for 8 models, content breakdown, structure scoring, readability metrics, and AI optimization recommendations
