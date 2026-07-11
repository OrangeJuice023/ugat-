# UGAT — Organizational Reasoning Platform

> "See what your organization feels before it breaks."

An interview-grade interactive prototype of an **Organizational Reasoning Platform** — software that reasons about *why* an organization behaves the way it does, not just *what* happened. Built with Next.js 15 (App Router) and a live, grounded AI agent on a **zero-cost** free tier.

## What's inside

- **Executive Briefing** — an intelligence briefing, not a dashboard. Three diagnoses, each with its evidence attached.
- **The reasoning loop** — every insight visibly *thinks*, then walks Observe → Competing Hypotheses → Evidence → Confidence → Recommendation → Outcome. It weighs alternatives and refuses false precision (strong/moderate/weak, not fake percentages).
- **Executive Translation Layer** — the same insight, re-voiced live for Analyst / Manager / Executive.
- **Organizational Graph** — the company as relationships, not records. Hover a node for health, dependencies, hidden risks, projects, and past incidents.
- **Organizational Health** — behavior metrics (Friction, Decision Velocity, Dependency Health…), not vanity KPIs.
- **Ask UGAT** — a **live** agent grounded in the org graph, constrained to UGAT's method (systems over individuals). Runs on Groq's free tier, with an automatic scripted fallback so it never breaks.

The organization ("Alab Technologies") is synthetic and seeded, with three root causes deliberately planted so the reasoning is verifiable — and two of them share one root cause, so one intervention fixes three problems.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev                  # http://localhost:3000
```

The app works with **no environment variables at all** — the "Ask UGAT" agent falls back to scripted reasoning. To make it a live model call, add a free Groq key (below).

## The live agent (optional, free)

`Ask UGAT` calls **Groq's free API** (OpenAI-compatible) from a server route at `app/api/ask/route.js`. The key stays server-side and is never exposed to the browser.

1. Get a free key at https://console.groq.com/keys
2. Add it to `.env.local`:
   ```
   GROQ_API_KEY=gsk_...
   ```
3. Restart `npm run dev`.

If the key is missing, rate-limited, or the call fails, the route silently returns scripted reasoning — the demo never breaks.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. (Optional) Under **Settings → Environment Variables**, add `GROQ_API_KEY` for the live agent.
4. **Deploy.** That's it — Next.js is auto-detected, no config needed.

## Notes on scope (stated honestly)

The scripted insights are authored to demonstrate the reasoning loop. The Ask UGAT tab is a genuinely live call, grounded in the same data and constrained to the same rules. In production, deterministic detection (SQL/stats) would find anomalies and the model would generate and rank hypotheses against real event data. Integrations, auth, and scenario simulation are represented, not built.

## Stack

Next.js 15 · React 18 · Edge API route · Groq (free) · inline styles (no build-time CSS dependency). Light editorial design system: navy + cream, serif display, honest confidence.
