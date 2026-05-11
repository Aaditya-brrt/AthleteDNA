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

Vibe: hairline borders, kicker labels (`kicker` utility), magazine numbered sections ("Section 01", "Stage 04"). No glassmorphism, no neon, no gradients. Three.js reveal/corridor canvases stay dark (`#08080b`/`#0B0B0F`) for cinematic contrast.

Landing page is a hero layout with DNA helix (light gray `CatmullRomCurve3` tubes) as full-bleed background, radial-vignette wash over it for headline legibility.

---

## 8 Archetypes

| ID | Name | Color | Olympic primary | Paralympic primary |
|---|---|---|---|---|
| 1 | EXPLOSIVE POWERHOUSE | `#ef4444` | Shot Put, Discus, Hammer, Javelin, Weightlifting | Para-Powerlifting, Shot Put F40-46 |
| 2 | AEROBIC ENGINE | `#06b6d4` | Marathon, Triathlon, Cycling, Rowing, XC Ski | Handcycle, Para-Triathlon, Para-Rowing |
| 3 | PRECISION ARTIST | `#8b5cf6` | Archery, Shooting, Fencing, Artistic Gymnastics, Figure Skating | Para-Archery, Boccia, Wheelchair Fencing |
| 4 | VERSATILE DYNAMO | `#f59e0b` | Decathlon, Heptathlon, Pentathlon | Para multi-event, Sitting Volleyball |
| 5 | STRENGTH ANCHOR | `#f97316` | Judo, Wrestling, Rugby 7s | Wheelchair Rugby, Para-Powerlifting |
| 6 | REACTIVE SPEEDSTER | `#22c55e` | 100/200m, Long/Triple Jump, Table Tennis | Wheelchair Sprint T51-54, Para-TT, T64 Sprint |
| 7 | KINETIC CONTROLLER | `#ec4899` | Diving, Rhythmic Gym, Equestrian, Sailing | Para-Equestrian, Para-Sailing |
| 8 | ADAPTIVE WARRIOR | `#f59e0b` | (none — Paralympic-primary) | Wheelchair Basketball/Tennis, Goalball, Boccia |

Archetype 8 only surfaces when impairment selected; renders largest in `paralympicFirst` mode.

Full primary lists live in `lib/constants.ts` (`ARCHETYPES[].olympicSports` / `.paralympicSports`).

---

## Anonymisation rule (compliance)

**No athlete names anywhere in client-facing content.** USOPC/IOC IP concerns + Apache 2.0 outbound scope. Twins are referenced by **cohort handles** assembled server-side:

- Format: `{pathway} {discipline} {year}{ (medal)?}` — e.g. `Olympic 100m Sprint 1996 (Gold)`, `Paralympic Wheelchair Rugby 2016`
- For IOC umbrella sports ("Athletics", "Aquatics", "Cycling", "Gymnastics", "Para-Athletics", "Para-Cycling", "Para-Swimming"), the discipline label uses `event` instead of `sport`
- Collisions disambiguated with Roman numerals: `Olympic Shot Put 2024 (Gold)`, `Olympic Shot Put 2024 (Gold) II`

Era anchors in `lib/eraWalk.ts::ERA_SEEDS` are cohort-level achievements ("Olympic wrestling gold breaks a longstanding barrier for Team USA") — never person-identifying.

Era `archetype_motto` is unattributed first-person-plural ("We arrive heavy and leave first.") — no quote attribution.

---

## Hard rules (judging criteria — non-negotiable)

1. **Olympic + Paralympic parity.** Equal card sizes, equal description depth, 3+3 twins always. `paralympicFirst === true` (derived from `formData.has_impairment`) swaps Paralympic to leftmost / largest.
2. **Conditional language only.** Banned: `you will`, `you would`, `you can achieve`, `your performance`, `your predicted`, `guaranteed`. Required: `could`, `may`, `historically associated with`, `athletes with this profile have`, `archetype aligns with`. Audit hardcoded strings before deploy.
3. **Visible Gemini attribution.** "Powered by Gemini 2.5" badge in conversation footer + corridor header + profile dashboard footer.
4. **No private identification.** See anonymisation rule above. Twin cohort handles only — no athlete names ever surfaced to client.
5. **Apache 2.0** — `LICENSE` at root, header comment in source files.

---

## API surface (post-refactor)

Live routes under `app/api/`:

| Route | Purpose | Gemini? |
|---|---|---|
| `conversation/start` | Kick off Q&A — system prompt + first question | Yes (Flash chat) |
| `conversation/continue` | Each follow-up turn; returns `{done:true, summary}` on 5th model turn | Yes (Flash chat) |
| `dossier` | **Unified** archetype + sport blurbs + twin DNA + era enrichment + intro/outro | Yes (Flash, one call) |
| `simulate` | Sport range data for `/simulate` page | Optional |

**One Gemini call** (`/api/dossier`) replaces three earlier endpoints (classify + twins + era-walk) for the post-conversation reveal flow. Per full session: ~5–7 requests total (conversation/start + 3–5 continue + 1 dossier + optional simulate), output ~2000–2700 tokens.

### Dossier endpoint mechanics

`POST /api/dossier { formData, conversationSummary }` →

1. `rankArchetypes` (lib/similarity.ts) produces top-3 shortlist with reasons
2. `buildTwinPools` (lib/twins.ts) — unified pool of 8 olympic + 8 paralympic candidates, sorted by:
   1. sport-overlap with `formData.sports` (binary)
   2. biometric distance
   **Archetype-agnostic** — Gemini may pick twins from any archetype that match the user's actual sport
3. ONE Gemini Flash call. Prompt includes form data, conversation summary, top-3 shortlist with ranker reasons, indexed twin pool with `archetype_id` + `sport_overlap=YES/no` flags, era anchors for each shortlisted archetype
4. Gemini returns picked `archetype_id` + sport blurbs + `olympic_twin_indices`/`paralympic_twin_indices` (3 each) + twin narratives + era enrichment + intro/outro
5. Server validates indices, resolves to athletes, pins archetype name/tagline from `ARCHETYPES` metadata, returns merged `{classification, eraWalk, twins}`

**Deterministic fallback** on Gemini failure (quota or parse): ranker top pick + archetype hardcoded sport list + first 3 of twin pool (already sport-prioritised) + seed era narratives.

**Hard guards** in dossier route:
- Gemini's `archetype_id` must be in shortlist — clamp to top if not
- Always pin `classification.archetype` + `classification.tagline` from `ARCHETYPES[id]` (Gemini sometimes drifts mid-generation)
- Index resolver filters out-of-range / duplicate twin picks, tops up from pool front

### Gemini retry-with-backoff

`lib/gemini.ts::withGeminiRetry(fn, label, maxRetries=3)` wraps every Gemini call. Retries on transient errors (503 / 500 / 504 / "Service Unavailable" / "high demand" / fetch failure / `ECONNRESET` / `ETIMEDOUT`) with backoff **500ms → 1000ms → 2000ms**. Does NOT retry 429/quota (resets per-day on free tier) or other 4xx. Wrapped sites: conversation/start, conversation/continue, dossier, `generateJSON`.

---

## Ranker (lib/similarity.ts) — sport-first bias

Composite score per archetype:

```
score = biometricFit + signalBoost
```

- **biometricFit** = `max(0, 1 - scaledDistance/0.6) × 0.5` → range 0..0.5 (halved so sport signals dominate)
- **signalBoost** stacks:
  - **Primary sport match** (+0.5) — user's selected sport substring-matches any entry in `ARCHETYPES[id].olympicSports` or `paralympicSports`. **Strongest single signal.**
  - **Adjacent sport match** (per-match 0.1, cap 0.2) — user's sport in `SPORT_TO_ARCHETYPE[id]` keyword bucket (multi-archetype mapping for cross-discipline fans, e.g. gymnastics → 1/3/6/7 for vault/artistic/tumbling/floor)
  - **Summary keyword scan** (per-match 0.15, cap 0.4) — picks up explicit intent from Gemini conversation summary ("explosive", "endurance", "tumbling", etc.)
  - **Build signals** (halved from prior values) — `broad_powerful` +0.18, `stocky` +0.11, `lean` +0.11, `tall_lean` +0.10, `athletic` +0.03. Build is biometric proxy — must not outweigh sport choice.
  - **Flexibility** — hypermobile/above_average → +0.10/+0.20 for archetypes 3/7; limited → +0.05 for 1/5
  - **Resting HR** — athlete-tier +0.12 for archetype 2
  - **Competition level** — 0.02–0.10 scaled
  - **Versatile Dynamo penalty** — base −0.10, additive boosts for athletic build + 3+ sports + varsity/elite
  - **Adaptive Warrior gating** — +0.25 if impairment, −0.50 if not

The dossier prompt tells Gemini that conversation keywords are **TONE not discipline** — "explosive" describes how a user trains within their sport, never promoting Speedster over Kinetic for a gymnast.

---

## Three.js conventions

- All R3F components wrapped with `next/dynamic(..., { ssr: false })` at parent boundary.
- `<Canvas gl={{ antialias: true }}>` — never `alpha: false` (breaks postprocessing `EffectComposer`).
- No `shadows` prop / `castShadow` unless meshes actually opt in (deprecation warnings otherwise).
- Reveal page phases driven by **local `useState`**, not Zustand — Zustand destructure causes effect re-runs that wipe the timer chain.
- `GEMINI_API_KEY` server-only — all Gemini calls via `app/api/*` routes.

### Corridor specifics

`components/three/CorridorScene.tsx` + `app/corridor/page.tsx`:

- Camera dollies from `CAMERA_START_Z = 8` toward `-ROOM_OFFSET - (stages.length - 1) * ROOM_SPACING`. More negative = deeper into corridor.
- Stages are scroll-driven; each ~110vh of scroll = one stage. `useScroll` (Framer Motion) → `scrollProgress` MotionValue → `useFrame` lerp into camera position.
- **Pathway room z order**: `z = 3 - i * 5` for sport panels. `sport[0]` (top priority) sits closest to camera entry (z=+3), `sport[2]` deepest (z=-7).
- **Twin plaque rotation**: `rotY = facing === "right" ? Math.PI / 2 : -Math.PI / 2` — left wall plaques face right (away from wall) so text reads forward.
- Hide window scrollbar on `/corridor` route via `scrollbar-hidden` class applied to BOTH `<html>` and `<body>` — the actual scrollbar lives on `documentElement`, not body.
- drei `<Text>` does NOT support `font-style` prop — passing it throws "Cannot convert undefined or null to object".

---

## Store (store/athleteStore.ts)

Zustand + persist + sessionStorage. Partialized fields: `formData`, `conversationHistory`, `conversationSummary`, `classificationResult`, `twins`, `selectedSport`, `eraWalk`.

`paralympicFirst` is a derived getter: `() => !!get().formData.has_impairment`.

`TwinAthlete.code` is the cohort handle (string) — never `name`. Type lives in store.

Persist hydration is **async** — components that read persisted state must either:
- Read directly from the store hook in render (auto-updates on hydration), OR
- Wrap in `requestAnimationFrame` before evaluating

Avoid `useState(storeValue)` pattern — captures the pre-hydration null.

---

## Data flow (intake → reveal → corridor → profile)

1. **Intake** (`/intake`) — 3-step form writes to `formData` via `setFormData`
2. **Conversation** (`/conversation`) — `/api/conversation/start` then 3–5× `/api/conversation/continue`. On `done:true`, calls `/api/dossier` ONCE. Stores `classification + eraWalk + twins` in zustand. Navigates to `/reveal`.
   - Instant-feedback UI: clicked option flips navy + "Picked" tag, others dim 35%, three-dot pulse + "Reading your answer · composing next question" line. State: `pendingAnswer`.
3. **Reveal** (`/reveal`) — reads `classificationResult` from store. Timer-driven phase chain 0→4 over 8s (local useState). Three.js avatar + sparkles + bloom ramp.
4. **Corridor** (`/corridor`) — reads `eraWalk + twins + classificationResult` from store. **Recovery refetch** to `/api/dossier` ONLY when entries missing (direct-link visit). Stages built by `lib/corridor.ts::buildStages`. Single full-screen R3F canvas with sticky camera dolly.
5. **Profile** (`/profile`) — 4-tab dashboard. `TwinsTab` reads twins from store; recovers via `/api/dossier` only if missing.

---

## Workflow

- Major UI changes / new Three.js scenes → run dev server, drive with Playwright MCP, screenshot before reporting done (per memory rule).
- Type check: `npx tsc --noEmit`.
- Data files in `/data/` are committed seed data (not regenerated at runtime).
- `.gitignore` excludes `*.png` (except under `public/`) and `.playwright-mcp/` so dev screenshots don't pollute commits.
