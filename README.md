# Eazo Weekend Jam Hackathon

Multimodal AI demo gallery powered by [MiniMax](https://www.minimax.io). Each demo is a standalone page showcasing a different AI capability — text-to-image, text-to-video, text-to-speech, music generation, and more.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env and add your MiniMax API key
cp .env.example .env

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the gallery.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Gallery landing page
│   ├── layout.tsx                      # Shared layout
│   ├── api/                            # API routes (server-side MiniMax calls)
│   │   └── generate-image/route.ts
│   └── demos/                          # Each demo is a standalone page
│       └── example-text-to-image/
│           └── page.tsx
├── components/                         # Shared UI components
│   └── demo-card.tsx
├── lib/                                # API clients and utilities
│   └── minimax.ts
└── demos.ts                            # Demo registry (gallery reads this)
```

## Adding a New Demo

### Option 1: GitHub Issue (recommended)

1. Go to [Issues → New Issue](https://github.com/yongkangzhao/eazo-weekend-jam-hackathon/issues/new?template=app-idea.yml)
2. Fill out the **App Idea** template
3. A maintainer labels it `approved`
4. GitHub Actions auto-scaffolds the demo and opens a PR

### Option 2: CLI scaffold

```bash
npm run scaffold -- my-demo "My Demo Title" "Description" "text-to-image,text-to-speech" "@yourname"
```

### Option 3: Manual

1. Create `src/app/demos/your-demo-slug/page.tsx`
2. Add an entry to `src/demos.ts`
3. If you need a server-side API route, add it under `src/app/api/`

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add `MINIMAX_API_KEY` and `MINIMAX_GROUP_ID` in Vercel → Settings → Environment Variables
4. Every push to `main` auto-deploys

## Team

4 contributors. Branch off `main`, open PRs, get a review, merge.

```bash
git checkout -b feat/my-demo
# ... build your demo ...
git push -u origin feat/my-demo
# Open PR on GitHub
```

## MiniMax APIs

| API | What it does | Client function |
|-----|-------------|-----------------|
| Text-to-Image | Generate images from prompts | `textToImage()` |
| Text-to-Speech | Generate speech audio | `textToSpeech()` |
| Text-to-Video | Generate video clips (Hailuo) | `textToVideo()` |
| Text-to-Music | Generate music | `textToMusic()` |

All client functions are in `src/lib/minimax.ts`. These are stubs — update the endpoints/payloads once API docs are finalized.
