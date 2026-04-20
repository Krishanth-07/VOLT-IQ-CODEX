# VOLT IQ CODEX

React + TypeScript + Vite application for energy analytics and AI-assisted suggestions.

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Create `.env` from `.env.example` and set your keys:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

3. Run development server:

```bash
npm run dev
```

## Deploy To Vercel

This project is configured for Vercel with a `vercel.json` file.

### Required Vercel Project Settings

1. Framework preset: `Vite`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Install command: `npm ci`

### Environment Variables In Vercel

Add these in Vercel Project Settings -> Environment Variables:

- `VITE_OPENAI_API_KEY`
- `VITE_GEMINI_API_KEY`

Set them for `Production` (and `Preview` if needed).

### SPA Routing

`BrowserRouter` routes are handled via rewrite in `vercel.json`, so direct URLs like `/solar` and `/what-if` resolve correctly.

## Build Check

```bash
npm run build
```

If build succeeds locally, Vercel deployment should also succeed with the same environment variables configured.
