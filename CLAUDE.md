@AGENTS.md

# Athlete DNA — Operating Rules

Hackathon app (Google Cloud × Team USA, Challenge 4). Live build; deep build spec archived at `docs/SPEC.md` — read on demand for screen-by-screen detail, original API contracts, dataset sources, Dockerfile, build-order plan.

---

## Stack (shipped)

- Next.js 16.2 (App Router, Turbopack, `output: 'standalone'`, async `params`/`searchParams`)
- React 19.2 · TypeScript strict · Tailwind v4 (`@theme inline` in `globals.css`, no config file)
- Framer Motion v12 · React Three Fiber v9 · @react-three/drei · @react-three/postprocessing · Three.js
- Zustand v5 (`persist` + `sessionStorage`)
- Recharts · html2canvas
- Gemini via `@google/generative-ai` — `gemini-2.5-flash` for everything (Pro quota was 0 on free tier)
- pnpm package manager
- Docker → Google Cloud Run · `GEMINI_API_KEY` env var

Next.js 16 has breaking changes vs training data — read `node_modules/next/dist/docs/` before touching framework APIs (per `AGENTS.md`).

---

## Theme (editorial paper — overrides original dark spec)

User explicitly lifted the original "no white backgrounds" rule. Live tokens in `app/globals.css`.

| Token | Hex |
|---|---|
| paper | `#FDFBF7` |
| ink | `#0B0B0F` |
| navy | `#0A2240` |
| red | `#BF0A30` |
| gold | `#A88134` |
| muted text | `#52525B` |
| border | `#E4E4E7` |

Fonts: Libre Bodoni (display serif) · Public Sans (body) · JetBrains Mono (kicker labels).

Vibe: hairline borders, kicker labels (`kicker` utility), magazine numbered sections ("Section 01", "Stage 04"). No glassmorphism, no neon, no gradients. Three.js reveal/sim canvases stay dark (`#0B0B0F`) for cinematic contrast.

---

## 8 Archetypes

| ID | Name | Color | Olympic primary | Paralympic primary |
|---|---|---|---|---|
| 1 | EXPLOSIVE POWERHOUSE | `#ef4444` | Shot Put, Discus, Hammer, Javelin, Weightlifting | Para-Powerlifting, Shot Put F40-46 |
| 2 | AEROBIC ENGINE | `#06b6d4` | Marathon, Triathlon, Cycling, Rowing, XC Ski | Handcycle, Para-Triathlon, Para-Rowing |
| 3 | PRECISION ARTIST | `#8b5cf6` | Archery, Shooting, Fencing, Gymnastics | Para-Archery, Boccia, Wheelchair Fencing |
| 4 | VERSATILE DYNAMO | `#f59e0b` | Decathlon, Heptathlon, Pentathlon | Para multi-event, Sitting Volleyball |
| 5 | STRENGTH ANCHOR | `#f97316` | Judo, Wrestling, Rugby 7s | Wheelchair Rugby, Para-Powerlifting |
| 6 | REACTIVE SPEEDSTER | `#22c55e` | 100/200m, Long/Triple Jump, Table Tennis | Wheelchair Sprint T51-54, Para-TT, T64 Sprint |
| 7 | KINETIC CONTROLLER | `#ec4899` | Diving, Rhythmic Gym, Equestrian, Sailing | Para-Equestrian, Para-Sailing |
| 8 | ADAPTIVE WARRIOR | `#f59e0b` | (none — Paralympic-primary) | Wheelchair Basketball/Tennis, Goalball, Boccia |

Archetype 8 only surfaces when impairment selected; renders largest in `paralympicFirst` mode.

---

## Hard rules (judging criteria — non-negotiable)

1. **Olympic + Paralympic parity.** Equal card sizes, equal description depth, 3+3 twins always. `paralympicFirst === true` (derived from `formData.has_impairment`) swaps Paralympic to leftmost / largest.
2. **Conditional language only.** Banned: `you will`, `you would`, `you can achieve`, `your performance`, `your predicted`, `guaranteed`. Required: `could`, `may`, `historically associated with`, `athletes with this profile have`, `archetype aligns with`. Audit hardcoded strings before deploy.
3. **Visible Gemini attribution.** "Powered by Gemini 2.5" badge in conversation footer + profile dashboard footer.
4. **No private identification.** Twin matching uses public Kaggle dataset names only.
5. **Apache 2.0** — `LICENSE` at root, header comment in source files.

---

## Three.js conventions

- All R3F components wrapped with `next/dynamic(..., { ssr: false })` at parent boundary.
- `<Canvas gl={{ antialias: true }}>` — never `alpha: false` (breaks postprocessing `EffectComposer`).
- No `shadows` prop / `castShadow` unless meshes actually opt in (deprecation warnings otherwise).
- Reveal page phases driven by **local `useState`**, not Zustand — Zustand destructure causes effect re-runs that wipe the timer chain.
- `GEMINI_API_KEY` server-only — all Gemini calls via `app/api/*` routes.

---

## Workflow

- Major UI changes / new Three.js scenes → run dev server, drive with Playwright MCP, screenshot before reporting done (per memory rule).
- Type check: `npx tsc --noEmit`.
- Data files in `/data/` are committed seed data (not regenerated at runtime).
