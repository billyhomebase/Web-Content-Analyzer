# AI Token Analyzer

A web tool that analyzes any URL and estimates AI token usage and processing costs across 8 major LLM models. It compares raw HTML versus cleaned text token counts, providing detailed content breakdowns, page structure analysis, readability scores, and actionable optimization recommendations.

## Features

- **Multi-Model Token Estimation** — Calculates token counts and costs for 8 LLM models:
  - OpenAI GPT-4o, GPT-4o mini (exact counts via tiktoken)
  - Anthropic Claude 3.5 Sonnet, Claude 3.5 Haiku
  - Google Gemini 2.0 Flash, Gemini 1.5 Pro
  - Meta Llama 3.1 70B
  - Mistral Large
- **Raw HTML vs Cleaned Text** — Side-by-side comparison showing how much markup inflates token usage
- **Content Breakdown** — Total bytes, text vs script vs style vs markup ratios, image and link counts
- **Structure Analysis** — Heading hierarchy, semantic elements, meta tags, Open Graph detection, nesting depth
- **Readability Metrics** — Word/sentence/paragraph counts, average lengths, Flesch-Kincaid readability score and grade level
- **Optimization Recommendations** — Categorized suggestions (content, structure, performance, accessibility) with impact ratings
- **URL History** — Tracks the 50 most recently analyzed URLs with running averages for tokens and markup ratio
- **Adult Content Filtering** — Flagged domains are analyzed for the user but excluded from history, counts, and averages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| UI Components | Shadcn UI, Radix UI, Tailwind CSS |
| Charts | Recharts |
| Backend | Express.js (Node.js) |
| Database | PostgreSQL via Drizzle ORM |
| Tokenizer | js-tiktoken (exact OpenAI token counts) |
| HTML Parsing | Cheerio |

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   ├── home.tsx          # Main analysis page with URL input and results
│   │   └── history.tsx       # Recent 50 analyzed URLs with expandable details
│   ├── components/           # UI components for results sections
│   └── lib/                  # Query client and utilities
├── server/
│   ├── analyzer.ts           # Core analysis engine (fetching, parsing, token estimation)
│   ├── routes.ts             # Express API routes
│   ├── storage.ts            # Database storage layer (IStorage interface)
│   ├── db.ts                 # PostgreSQL connection pool
│   └── index.ts              # Server entry point
├── shared/
│   └── schema.ts             # Drizzle schema, Zod validation, TypeScript interfaces
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze a URL — accepts `{ url: string }`, returns full `AnalysisResult` |
| `GET` | `/api/history` | Returns `{ urls: AnalyzedUrl[], totalCount: number }` (max 50 recent) |
| `GET` | `/api/history/count` | Returns `{ totalCount: number }` |
| `GET` | `/api/averages` | Returns running averages for tokens and markup ratio across all analyses |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ai-token-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   SESSION_SECRET=your-session-secret
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`.

## How It Works

1. **Fetch** — The analyzer fetches the target URL's HTML content
2. **Parse** — Cheerio parses the HTML to extract text, structure, and metadata
3. **Clean** — Scripts, styles, and markup are stripped to produce cleaned text
4. **Tokenize** — Token counts are calculated for each model (exact for OpenAI via tiktoken, estimated for others based on character-per-token ratios)
5. **Score** — Structure and readability scores are computed
6. **Recommend** — Optimization suggestions are generated based on the analysis
7. **Store** — The URL and key metrics are saved to the database for history tracking

## License

MIT

---

Built by Billy Hanna — [LinkedIn](https://www.linkedin.com/in/billyhanna)
