# Smart Closet AI: project conventions

@AGENTS.md

Prototype V1 of a style assistant (MBA project, UCEMA). Next.js App Router + TypeScript (strict) + Tailwind v4. No backend beyond route handlers, no database, no login, no paid APIs or LLMs in V1.

## Languages
- **User-facing text: Spanish (Río de la Plata), voseo** ("elegí", "agregá", "tenés", "probá otra"). Short, warm, no hype.
- **Everything else in English:** identifiers, file names, comments, commit messages.
- **All UI strings live in `src/copy/es-AR.ts`.** Never hardcode Spanish in components. Recommendation explanations are structured codes (`Reason`, `RuleViolation` in `src/types/outfit.ts`) formatted by `formatReason` / `formatViolation` in the copy file.

## Status labeling (graded by the course)
Every feature surface must show a `StatusBadge` (`src/components/StatusBadge.tsx`):
- `working` → "Funciona": really works with the user's data.
- `simulated` → "Simulado": looks real but is a simple stand-in (e.g. keyword chat).
- `comingSoon` → "Próximamente": visible concept, does nothing (disabled or shows a toast).

When you add, change or promote a feature, update **both** its badge and the capability list in `copy.about.capabilities` (rendered at `/about`), plus the README tables.

## Structure
```
src/app/            routes (/, /wardrobe, /saved, /shopping, /about) and /api/weather, /api/geocode
src/components/     UI; studio/ and wardrobe/ hold screen-specific pieces
src/copy/es-AR.ts   all user-facing copy
src/lib/recommendation/  pure scoring rules + RuleBasedRecommender (no React imports)
src/lib/weather/    Open-Meteo URL builders/parsers, client fetchers, useWeather hook, manual fallback
src/lib/storage/    localStorage store (memory fallback), IndexedDB photos (memory fallback)
src/lib/image/      client-side photo resize/compression
src/lib/store/      persistent app state via useSyncExternalStore
src/types/          domain types
docs/decision-log.md  append an entry for every relevant technical decision
```

## Recommendation engine
- UI depends only on `OutfitRecommender` (`src/lib/recommendation/types.ts`), obtained via `getRecommender()` in `src/lib/recommendation/index.ts`.
- V2 plan: add `LlmRecommender` implementing the same interface, falling back to `RuleBasedRecommender` on error, timeout or invalid output. Swap it in `getRecommender()` only.
- Keep rules pure and deterministic (inject `now`). Add a test for every new rule or edge case.

## Commands
- `npm run dev`: local dev server.
- `npm test`: Vitest (recommendation, keyword detection, forecast parsing, image sizing).
- `npm run lint`, `npm run build`: both must pass before committing.

## Gotchas
- Next.js 16 with `cacheComponents: true`: read the docs in `node_modules/next/dist/docs/` before using caching APIs. Route handlers that read the request are dynamic; caching is done with an in-memory map + `Cache-Control: s-maxage`.
- The React lint rules forbid synchronous `setState` inside effects; derive state or set it from async callbacks.
- A `<fieldset>` with a horizontal scroller needs `min-w-0`, or it widens the page on phones.
- Open-Meteo free tier: non-commercial, rate-limited per IP, requires the CC BY 4.0 attribution link in the footer. Do not call it from the client directly.
- No secrets and no required env vars in V1.
