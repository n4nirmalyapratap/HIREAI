# HireAI — AI Interview Platform

## Overview

An AI-powered hiring and interview platform built for small teams (1-50 people). The core differentiator: every interview question is *designed* so candidates must use AI skillfully to succeed — testing how well people work *with* AI, not whether they can work without it.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/hire-ai)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI Scoring**: OpenAI via Replit AI Integrations (gpt-5-mini for response scoring)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Features

- **Dashboard** — pipeline health, avg AI scores, recent activity feed
- **Job Postings** — create and manage job listings with status tracking
- **Applicant Management** — filterable candidate pipeline with AI scoring
- **AI Interview System** — interview sessions with AI-collaborative questions that require AI to answer well
- **Question Bank** — library of AI-collaborative interview questions with category, difficulty, and AI context hints
- **AI Scoring** — automatic response scoring via GPT evaluating: AI utilization, depth of reasoning, accuracy, communication

## AI Interview Philosophy

Questions are intentionally designed so candidates NEED to use AI tools to answer them well. The AI scorer rewards:
- Skillful use of AI tools (ChatGPT, Claude, Copilot, etc.)
- Critical thinking applied on top of AI outputs
- Depth of reasoning, not just correct answers

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

- `artifacts/hire-ai/` — React + Vite frontend (preview at `/`)
- `artifacts/api-server/` — Express API server (routes at `/api`)
- `lib/db/` — Drizzle ORM schema + DB client
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validators for server-side validation
- `lib/integrations-openai-ai-server/` — OpenAI client via Replit AI Integrations

## DB Schema

- `jobs` — job postings with type, status, salary range
- `applicants` — candidates with AI scores and pipeline status
- `questions` — AI-collaborative interview questions with aiContext and evaluationCriteria
- `interviews` — interview sessions with overall scores and AI verdicts
- `interview_responses` — candidate answers with per-question scores and AI feedback

## Note on codegen

After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then immediately fix `lib/api-zod/src/index.ts` to only export from `./generated/api` (orval regenerates both exports causing duplicate conflicts).
