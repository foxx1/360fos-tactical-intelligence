# 360FOS Tactical Intelligence

Football tactical intelligence and match preparation platform.

## MVP

The MVP connects the coaching workflow:

**Match → Analysis → Evidence → Strengths & Weaknesses → Gap Analysis → Training Priority → Exercise → Match Plan → Post-Match Validation**

## Repository Structure

- `apps/web` — Next.js web application
- `apps/api` — NestJS REST API
- `packages/database` — Prisma domain schema
- `packages/types` — shared TypeScript types
- `docs` — product and architecture documentation

## Stack

- Next.js + TypeScript
- NestJS
- Prisma 6
- PostgreSQL / Supabase
- Supabase Auth

## Current Branch

`feature/mvp-foundation`

## First Vertical Slice

1. Create Match
2. Opponent Analysis
3. Add Evidence
4. Identify Strength / Weakness
5. Create Tactical Gap
6. Create Training Priority

## Development Principles

- Evidence before diagnosis.
- Diagnosis before training priority.
- Training priority before match objective.
- Coach remains the final decision maker.
- Organization data must be isolated.
- MVP first; AI and computer vision come after the core workflow is proven.
