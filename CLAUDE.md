# Eazo Weekend Jam — Project Instructions

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Deployed on Vercel (standalone output)
- MiniMax APIs for multimodal AI (text-to-image, speech, video, music)

## Architecture
- Single Next.js app — each demo is a standalone page under `src/app/demos/[slug]/`
- Gallery landing page at `/` reads from `src/demos.ts` registry
- Server-side API routes under `src/app/api/` handle MiniMax calls (keep API keys server-side)
- Shared MiniMax client in `src/lib/minimax.ts`

## Conventions
- Demo pages are `"use client"` components
- API routes use Next.js Route Handlers (`route.ts`)
- All MiniMax API keys must stay server-side (never expose in client components)
- Each demo should be self-contained — no cross-demo imports
- When adding a demo, always register it in `src/demos.ts`

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run scaffold -- <slug> <title> <desc> <apis> <author>` — scaffold new demo
