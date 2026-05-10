# Athlete DNA — Full Build Spec (Archived)

This is the original Claude Code build prompt, archived from `CLAUDE.md`. The lean operational rules now live in `CLAUDE.md`. Read this file on demand for: screen-by-screen detail, original API contracts, dataset sources, file/folder layout, Dockerfile body, build-order day plan, demo video requirements.

---

## PROJECT OVERVIEW & PURPOSE

Build **Athlete DNA** — a full-stack, cinematic web application for the Google Cloud x Team USA hackathon (Challenge 4: The Athlete Archetype Agent). The app is a gamified, deeply interactive experience where users input their biometrics and physical profile to discover which of 8 "Athlete Archetypes" they match from 120 years of Team USA history. The app surfaces both Olympic AND Paralympic sport pathways with equal analytical depth, simulates the user's archetype performing in matched sports, and shows real historical Team USA athletes who share their physical profile.

This is a **competitive hackathon submission**. The judges will interact with this app live. Every screen must be visually extraordinary. The Three.js scenes, transitions, and animations are not decorative — they ARE the product. Do not cut corners on visual quality. The frontend is the demo.

The app must be deployed on **Google Cloud Run** and use the **Gemini API** as its intelligence layer.

---

## CORE USER JOURNEY (Build Every Step)

### Step 1 — Landing Page
### Step 2 — Biometric Intake Form (3 steps)
### Step 3 — Gemini Conversational Follow-Up
### Step 4 — The Archetype Reveal (Three.js cinematic sequence)
### Step 5 — Full DNA Profile Dashboard (4 tabs)
### Step 6 — Sport Simulation
### Step 7 — Shareable Athlete Card

Each step is detailed below.

---

## TECH STACK (Use Exactly These)

### Frontend
- **Next.js 16.2** (latest stable — use `npx create-next-app@latest` with App Router)
- **React 19.2** (bundled with Next.js 16)
- **TypeScript** — strict mode throughout
- **Tailwind CSS v4** — for all UI styling
- **Framer Motion v11** — for all page transitions, component animations, stagger effects
- **React Three Fiber v9** (`@react-three/fiber`) — Three.js React renderer (pairs with React 19)
- **@react-three/drei** — Three.js helpers (Stars, Float, Environment, Text, useGLTF, Sparkles, MeshDistortMaterial, OrbitControls)
- **@react-three/postprocessing** — post-processing effects (Bloom, ChromaticAberration, Vignette, Glitch)
- **Three.js** (installed as peer dep of R3F)
- **Zustand** — global state management (form data, archetype result, simulation state)
- **Recharts** — for the bell curve / distribution chart in simulation tab

### Backend (Next.js API Routes — all in `/app/api/`)
- **Google Gemini 2.5 Pro** (`gemini-2.5-pro`) — for the conversational follow-up questions (multi-turn, requires deep reasoning about biometrics)
- **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) — for fast archetype classification call (structured JSON output mode)
- **@google/generative-ai** SDK — official Google AI JS SDK

### Deployment
- **Google Cloud Run** — containerized deployment
- **Dockerfile** included at project root
- Environment variable: `GEMINI_API_KEY`

### Data
- Pre-processed JSON files in `/data/` directory (sourced from datasets described below, pre-filtered to US athletes only, cleaned at build time — NOT fetched at runtime)

---

## DATASETS TO USE

### Primary Olympic Dataset
**Source:** Kaggle — "120 years of Olympic history: athletes and results"
**URL:** `https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results`
**Files:** `athlete_events.csv` (271,116 rows, 15 columns) + `noc_regions.csv`
**Columns available:** ID, Name, Sex, Age, Height, Weight, Team, NOC, Games, Year, Season, City, Sport, Event, Medal
**Filter to:** rows where `NOC == 'USA'`
**Pre-process into:** `/data/usa_olympic_athletes.json` — array of athlete objects with fields: name, sex, age, height_cm, weight_kg, sport, event, year, season, medal, games

### Secondary Olympic Dataset (more recent, through 2024)
**Source:** Kaggle — "Olympic Historical Dataset from Olympedia.org"
**URL:** `https://www.kaggle.com/datasets/josephcheng123456/olympic-historical-dataset-from-olympediaorg`
Use this to fill in 2016–2024 athletes missing from the primary dataset. Merge with primary on athlete name + year to avoid duplicates.

### Paralympic Dataset
**Source:** Kaggle — "60 years of Paralympics"
**URL:** `https://www.kaggle.com/datasets/shivagovindasamy/60-years-of-paralympics`
**Additional Source:** Kaggle — "Paralympics 2024 Dataset"
**URL:** `https://www.kaggle.com/datasets/suvroo/paralympics-2024-dataset`
**Pre-process into:** `/data/usa_paralympic_athletes.json` — same schema as Olympic file, add fields: impairment_category, ipc_classification
**Filter to:** US athletes only

### Data Preprocessing Script
Create `/scripts/preprocess-data.ts` that:
1. Reads raw CSVs
2. Filters to US athletes
3. Cleans missing height/weight (drop rows with both missing; keep rows with at least one)
4. Normalizes height to cm, weight to kg
5. Computes `arm_span_estimate` = height_cm * 1.02 for athletes without direct arm span data (this is a known anthropometric approximation)
6. Assigns each athlete to one of the 8 archetypes (see archetype definitions below) based on sport + biometric clustering
7. Outputs clean JSON files to `/data/`

This script is run ONCE at dev time. The `/data/` JSON files are committed to the repo and served statically.

---

## SCREEN-BY-SCREEN BUILD SPECIFICATIONS

---

### SCREEN 1 — LANDING PAGE (`/app/page.tsx`)

**Layout:** Full viewport, dark background (#0a0a0f), no scroll on this screen.

**Three.js Background Scene (mandatory, renders behind all content):**
- Use `<Canvas>` from React Three Fiber, `position: fixed`, `z-index: 0`, full screen
- Render a slowly rotating DNA double helix built from instanced small spheres (`<Sphere>` with radius 0.08)
- Two strands, each with ~40 nodes, connected by "rungs" (`<Cylinder>` meshes between opposing nodes)
- Helix color: strand 1 in electric blue (#3b82f6), strand 2 in gold (#f59e0b), rungs in white at 30% opacity
- Rotation: `useFrame` hook, rotate entire helix group on Y axis at 0.003 rad/frame
- Postprocessing: `<EffectComposer>` with `<Bloom threshold={0.3} strength={0.8} radius={0.5} />` and `<Vignette darkness={0.6} />`
- Add `<Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />` from drei for depth
- The helix should be built from tiny athlete silhouettes if SVG sprites are feasible; otherwise instanced spheres are fine

**Foreground UI (z-index: 10, centered, flex column):**
- Small badge top: `GOOGLE CLOUD × TEAM USA HACKATHON` in uppercase, letter-spacing wide, gold color, small font
- Main headline (Framer Motion `animate` on mount): `"120 years of Team USA."` then animated line break then `"Where do YOU fit?"` — the YOU pulses with a gold glow CSS animation
- Subheadline: `"Discover your Athlete Archetype across Olympic and Paralympic pathways"` — muted white, smaller
- CTA Button: `"Discover Your Athlete DNA"` — large, filled, gradient from #3b82f6 to #8b5cf6, rounded-full, on hover scale 1.05 with Framer Motion, onClick navigates to `/intake`
- Below button: small text `"Both Olympic and Paralympic pathways analyzed with equal depth"` with ♿🥇 icons

**Typography:** Use `next/font` to load **Inter** (body) and **Space Grotesk** (headings) from Google Fonts.

---

### SCREEN 2 — BIOMETRIC INTAKE FORM (`/app/intake/page.tsx`)

**Layout:** Dark background, centered card (max-w-2xl), multi-step with animated progress bar. No Three.js on this screen — keep it fast and focused.

**Progress Bar:** Framer Motion animated width, 3 steps. Color: gold (#f59e0b) fill on dark track.

**Step transitions:** `<AnimatePresence>` with `initial={{ x: 100, opacity: 0 }}` / `exit={{ x: -100, opacity: 0 }}` slide transitions between steps.

**STEP 1 — The Basics:**
All inputs use custom styled components, not browser defaults.
- **Height:** Dual slider (feet + inches) OR cm toggle. Show a visual silhouette that grows/shrinks in real time as slider moves (SVG silhouette, update viewBox transform)
- **Weight:** Slider, 80–400 lbs. Show numeric value updating live.
- **Age:** Slider, 14–80.
- **Biological sex:** Two large toggle buttons (Male / Female) — used only for biometric clustering, label explains this inline: *"Used only for sport archetype matching — not for judgment"*
- **Dominant side:** Three pill buttons (Left / Right / Ambidextrous)

**STEP 2 — Your Body:**
- **Arm span:** Slider with helper diagram (small inline SVG showing T-pose measurement). Prepopulate with height value as default estimate.
- **Flexibility:** Four illustrated cards with icons (Limited 🧱 / Average / Above Average / Hypermobile 🤸) — click to select
- **Build:** Five illustrated cards (Lean / Athletic / Stocky / Tall & Lean / Broad & Powerful) — each shows a body shape silhouette SVG
- **Resting heart rate:** Optional. Three pill buttons (Low <60 / Average 60-80 / Athlete-level <50). Show "optional" badge.

**STEP 3 — Your Activity Profile:**
- **Sports/activities:** Tag cloud multi-select. Show 20+ tags: Running, Swimming, Cycling, Weightlifting, Martial Arts, Wrestling, Gymnastics, Basketball, Football, Baseball, Soccer, Tennis, Volleyball, Track & Field, Rowing, Skiing, Skating, Archery, Shooting, Equestrian, Climbing, Triathlon. Selected tags glow gold.
- **Active years:** Slider (0–30+ years)
- **Competition level:** Four cards (Just for fun / School/club / Varsity/competitive / Elite/professional)

**Paralympic Section (bottom of Step 3):**
Visually separated with a subtle divider and section header: `"Paralympic Pathway"` with ♿ icon.
Text: *"Athlete DNA analyzes Olympic and Paralympic pathways with equal depth and analytical rigor. If you have a physical impairment, we'll prioritize your Paralympic profile."*

Toggle switch (large, custom styled): **"I have a physical impairment"**

When toggled ON, animate in (Framer Motion height animation) a dropdown select with these exact options grouped by IPC category:
```
Limb Impairment:
  - Limb deficiency (upper limb)
  - Limb deficiency (lower limb)
  - Leg length difference
  - Short stature
Muscle Function / Tone:
  - Hypertonia (muscle tension/spasticity)
  - Ataxia (coordination impairment)
  - Athetosis (involuntary movement)
Vision:
  - Vision impairment (partial — B2/B3)
  - Vision impairment (total — B1)
Intellectual:
  - Intellectual impairment (II1)
```

Selecting any option sets a global state flag `paralympicFirst = true`. This flag controls the entire downstream experience.

**Submit button:** `"Analyze My DNA →"` — disabled until all required fields in current step are filled. On final step submit, navigate to `/conversation`.

**State:** Store all form data in Zustand store (`useAthleteStore`).

---

### SCREEN 3 — GEMINI CONVERSATION (`/app/conversation/page.tsx`)

**Aesthetic:** Dark screen. NOT a chat UI. Styled like a mission control terminal — monospace font for Gemini's questions, clean text input at bottom. Think NASA meets sports analytics.

**Background:** Subtle animated grid (CSS `background-image` with linear-gradient lines), slow pulse animation. No Three.js here.

**Top bar:** Small logo left, progress indicator `"Finalizing your profile... Step 3 of 4"`, right side shows a pulsing green dot `"GEMINI ANALYZING"`.

**Flow:**
1. On mount, send form data to `/api/conversation/start` (POST)
2. API calls **Gemini 2.5 Pro** with a structured system prompt (detailed below)
3. Gemini responds with the first question as JSON: `{ question: string, options?: string[], type: "text" | "select" | "multiselect" }`
4. Display question with a typewriter effect (character by character, 30ms per char)
5. If `options` provided, render as large pill buttons below the question. If `type: "text"`, show a text input.
6. User answers → send to `/api/conversation/continue` → Gemini asks next question
7. After 3–5 questions, Gemini returns `{ done: true, summary: string }`
8. Screen shows: `"Profile complete. Analyzing your Athlete DNA..."` with a loading animation
9. Auto-navigate to `/reveal` after 1.5s

**Gemini System Prompt for Conversation (`/api/conversation/start`):**
```
You are an elite sports scientist and athlete profiling agent for Team USA.
You have received biometric data about a user and must ask 3-5 targeted follow-up questions to sharpen their Athlete Archetype assignment.

Rules:
- Ask only ONE question at a time
- Questions must dig deeper into ambiguities in the biometric data
- Always return JSON in this exact format: { "question": "...", "options": ["...", "..."], "type": "select" }
- For open-ended questions, omit options and set type to "text"
- After 3-5 questions, return: { "done": true, "summary": "2-3 sentence summary of the full profile" }
- NEVER ask about medical history beyond what the user already provided
- NEVER make performance predictions or guarantees
- NEVER identify specific private individuals from biometrics
- Use conditional language: "could suggest", "may align with", "historically associated with"
- Keep questions conversational but precise — like a scout interview
- If the user indicated a disability impairment, ask at least one follow-up about which side is affected, severity level, or sport history with the impairment
- Example good questions based on data:
  - If arm span >> height: "Your arm span is notably longer than your height — in activities you've done, have you felt particularly effective at reaching, throwing, or pulling movements?"
  - If high weight + strength sports: "When you've lifted or pushed heavy loads, do you feel your power comes more from your legs and hips, or your upper body?"
  - If hypermobile flexibility: "With your high flexibility, have you ever been told you're 'double-jointed' or had coaches comment on your range of motion?"

Biometric data received:
[INJECT FORM DATA HERE AS JSON]
```

**API Route `/api/conversation/start` and `/api/conversation/continue`:**
- Use `@google/generative-ai` SDK
- Model: `gemini-2.5-pro`
- Enable JSON response mode (set `responseMimeType: "application/json"`)
- Maintain conversation history array in request body for multi-turn (pass full history each call)
- Stream responses for the typewriter effect (use Gemini streaming API)

---

### SCREEN 4 — THE REVEAL (`/app/reveal/page.tsx`)

**This is the most important screen. It must be extraordinary. Spend the most time here.**

The entire screen is a Three.js `<Canvas>`. The UI overlays float on top using absolute positioning with pointer-events managed carefully.

**THE REVEAL SEQUENCE (runs automatically, ~8 seconds total):**

**Phase 1 (0–2s): The Particle Convergence**
- Start: 2000 small particles scattered across the screen in a sphere formation, each a tiny `<Points>` instance, colored in random Team USA colors (red, white, blue, gold)
- Animation: All particles accelerate toward the center using `useFrame` with lerp toward origin (lerp factor 0.05)
- Sound effect: Optional — if Web Audio API available, a subtle whoosh

**Phase 2 (2–4s): Avatar Assembly**
- As particles converge, they coalesce into a humanoid silhouette
- Build the avatar using basic Three.js geometries (NOT a GLTF model — build procedurally to avoid asset dependencies):
  - Head: `SphereGeometry(0.15)`
  - Torso: `CylinderGeometry(0.18, 0.22, 0.5)` — scale X based on user's build (stocky users get wider torso)
  - Upper arms: `CylinderGeometry(0.06, 0.06, 0.3)` × 2
  - Forearms: `CylinderGeometry(0.05, 0.05, 0.28)` × 2 — scale length based on arm span input
  - Legs: `CylinderGeometry(0.08, 0.07, 0.45)` × 2 — scale based on height
  - All parts use `MeshStandardMaterial` with color #1a1a2e initially (dark, unlit)
- Avatar should be proportioned to user's actual biometrics. Tall + lean → elongated torso + legs. Stocky → wider. Short + stature impairment → scale down.
- If `paralympicFirst === true` AND impairment is lower limb: replace one or both legs with a simplified prosthetic blade geometry (elongated diamond shape). If wheelchair user type: add a simplified wheelchair — two circles for wheels + a seat plane.
- Avatar assembles with a Framer Motion-like animation — parts fly in from outside frame and snap into position

**Phase 3 (4–6s): The Ignition**
- Once assembled, avatar material changes: `MeshStandardMaterial` switches to emissive, color animates to archetype color (each archetype has a signature color — see below)
- A burst of `<Sparkles>` from drei radiates outward from the avatar
- The `<Bloom>` postprocessing effect ramps up intensity during this phase (animate `strength` from 0 to 2.0 then settle to 0.8)
- The avatar slowly rotates on Y axis (showroom spin)

**Phase 4 (6–8s): The Text Slam**
- Archetype name slams in as a `<Text>` component from drei — large, bold, centered above avatar
- Font: use `https://fonts.gstatic.com/s/spacegrotesk/` (load via drei Text's font prop)
- Archetype name uses its signature color, large (fontSize: 0.4)
- Below: archetype tagline in smaller white text
- UI overlay: Three stat bars animate in using Framer Motion (from width 0 to final width)

**UI Overlay (absolute positioned, pointer-events: none during animation, then enabled):**
- Top: small badge showing `"YOUR ARCHETYPE"` label
- Center-right: three animated stat bars
  - Power ████░░░░░░ (score 0–10, computed from archetype)
  - Endurance ██████░░░░
  - Precision ████████░░
- Bottom: two badges appear: Olympic pathway badge (🥇) and Paralympic pathway badge (♿) — if `paralympicFirst`, the Paralympic badge is larger and appears first with a gold glow
- Bottom CTA: `"Explore Your Full Profile →"` button, onClick navigates to `/profile`

**API Route `/api/classify` (called before reveal screen loads):**
- Called from `/conversation` page after Gemini conversation is done
- Sends: full form data + conversation summary
- Uses **Gemini 2.5 Flash** with JSON response mode
- System prompt assigns one of the 8 archetypes and returns:
```json
{
  "archetype": "EXPLOSIVE POWERHOUSE",
  "archetype_id": 1,
  "tagline": "Built for force. Your profile aligns with Team USA's most powerful athletes across 120 years.",
  "stats": { "power": 9, "endurance": 3, "precision": 5 },
  "olympic_sports": ["Shot Put", "Discus Throw", "Weightlifting"],
  "paralympic_sports": ["Paralympic Powerlifting", "Shot Put F46", "Discus F44"],
  "reasoning": "Two-sentence explanation using conditional language",
  "paralympic_first": false
}
```
- Store result in Zustand

---

### SCREEN 5 — PROFILE DASHBOARD (`/app/profile/page.tsx`)

**Layout:** Two-column layout. Left sidebar (280px): avatar (smaller Three.js canvas, avatar continues rotating), archetype badge, stat bars, user's top stats. Right: tabbed content area.

**Left Sidebar:**
- Mini Three.js canvas showing the user's assembled avatar in showroom rotation
- Archetype badge (icon + name) in archetype color
- Stat bars (Power / Endurance / Precision) with animated fills
- User's key biometrics shown: Height, Weight, Arm Span, Build type
- If `paralympicFirst`: Paralympic badge shown first, larger, with "Paralympic Pathway" label in gold

**Tab Navigation:** Four tabs with pill-style navigation, active tab underlined in archetype color.

---

**TAB 1 — YOUR SPORTS**

Two equal-width columns, side by side. If `paralympicFirst === true`, swap columns so Paralympic is on LEFT.

**Column A — Olympic Pathway 🥇** / **Column B — Paralympic Pathway ♿**

Each sport gets a card:
```
┌─────────────────────────────┐
│ 🏋️ Shot Put                 │
│ ██████████ 94% Match        │
│                             │
│ "Your build and power       │
│ profile aligns with this    │
│ event's historical athlete  │
│ profile in Team USA."       │
│                             │
│ [ Simulate → ]              │
└─────────────────────────────┘
```
- Show 3 sports per pathway
- Match percentage computed from cosine similarity of user biometrics vs archetype centroid for that sport (compute server-side in `/api/classify`)
- Gemini-generated 1-2 sentence "why this sport" blurb (generated during classification call, stored in result)
- "Simulate" button routes to `/simulate?sport=[sport_id]`
- Cards use Framer Motion `whileHover={{ scale: 1.02, y: -2 }}` and stagger in on tab load

**CRITICAL:** Paralympic sport cards must have IDENTICAL visual design quality, IDENTICAL card size, IDENTICAL depth of information as Olympic cards. No shorter descriptions. No different styling. This is a judging criterion.

---

**TAB 2 — HISTORICAL TWINS**

Query `/api/twins` (POST with archetype_id + biometrics). Server-side:
1. Load `usa_olympic_athletes.json` and `usa_paralympic_athletes.json`
2. Filter to athletes whose sport matches one of the user's top matched sports
3. Among those, find athletes with height within ±8cm AND weight within ±10kg AND same sex
4. If fewer than 3 results, loosen constraints to ±15cm / ±20kg
5. Return top 6 athletes (3 Olympic, 3 Paralympic — equal split, always)
6. If fewer than 3 Paralympic athletes found for the archetype, fill with the closest available

**Each twin card:**
- Athlete name
- Sport + event
- Year / Games
- Biometric similarity shown: `"Similar height-to-weight profile, matching archetype cluster"`
- Their results (medal if any, conditional: `"Achieved [medal] in [event] — athletes with this profile have represented Team USA across multiple Games"`)
- Gemini-generated 2-sentence "DNA connection" narrative (generated in `/api/twins` call using Gemini Flash)
- A subtle similarity score (shown as DNA strand icon with % fill)

**Visual:** Cards in a 2×3 grid, Olympic twins have a 🥇 badge, Paralympic twins have a ♿ badge. Same card design. Stagger animation on load.

---

**TAB 3 — SIMULATE**

This tab hosts the simulation experience. Also accessible directly via `/simulate?sport=[id]`.

**Sport Selector:** Row of pill buttons for each of the user's matched sports (both Olympic and Paralympic). Active sport highlighted in archetype color.

**Three.js Simulation Canvas (600px height, full width):**

Each sport has its own animation. Build at minimum ONE fully animated simulation and stub the others with a "simplified" version (abstract track/arena + moving avatar).

**Priority simulation to build fully: Sprint / Wheelchair Sprint**

For Sprint:
- Side-scrolling perspective: camera follows avatar running left to right
- Track rendered as a flat plane with lane lines (`PlaneGeometry` + custom shader or just white line `BoxGeometry`s)
- Avatar uses a simplified running cycle (procedural animation via `useFrame`:
  - Legs alternate: each leg's cylinder rotates forward/back ±30 degrees at 4Hz frequency
  - Arms swing opposite: arm cylinders rotate ±20 degrees
  - Torso bobs slightly on Y axis)
- Finish line appears at the end, avatar crosses it, confetti `<Sparkles>` burst
- Camera: `PerspectiveCamera` tracking slightly behind and above avatar

For Shot Put (second priority):
- Static overhead view
- Avatar winds up (torso rotates 90° right over 0.5s)
- Releases: arm extends, sphere appears and traces a parabolic arc across the screen
- Arc rendered as a `<Line>` from drei, sphere moves along the line
- Distance marker appears where sphere lands with a small flag

For Wheelchair Racing:
- Same as Sprint but avatar includes wheelchair geometry
- Wheel rotation animation synchronized with forward movement

**Result Display (below canvas):**
After simulation completes, animate in:
- A distribution bell curve (Recharts `AreaChart` or custom SVG) showing the historical range for that sport/archetype
- X-axis: performance values (distance in meters, time in seconds)
- Shaded region: range where this archetype has historically been represented
- User's marker placed in the middle of that range
- Label: `"Athletes with your archetype profile have historically been represented across [X] to [Y] in this event"`
- Below curve: 3 historical twin data points shown as dots on the curve with athlete names

---

**TAB 4 — YOUR ATHLETE CARD**

A shareable card — designed to look like a premium sports trading card.

**Card Design (800×500px, rendered as HTML div, captured to PNG via `html2canvas`):**
```
┌────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░  [AVATAR SILHOUETTE]    ATHLETE DNA  ░  │
│  ░                         ─────────── ░  │
│  ░  ⚡ EXPLOSIVE            POWER   ████  │
│  ░    POWERHOUSE           ENDURANCE ██   │
│  ░                         PRECISION ███  │
│  ░  🥇 Shot Put                           │
│  ░  🥇 Weightlifting        TEAM USA      │
│  ░  ♿ Para Powerlifting     ════════════  │
│  ░  ♿ Shot Put F46          120 YEARS     │
│  ░                                        │
│  ░  "Your body type aligns with some of   │
│  ░   Team USA's most powerful athletes."  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────────────┘
```
- Background: gradient in archetype color (dark to darker)
- Card border: gold (#f59e0b) with subtle glow CSS shadow
- Avatar silhouette: SVG export of the Three.js avatar proportions
- Gemini-generated 1-paragraph athlete story (generated during classification, stored in result)
- Olympic sports listed with 🥇, Paralympic sports with ♿ — equal visual weight

**Buttons below card:**
- `"Download Card"` — captures div to PNG using `html2canvas`, triggers download
- `"Share on X"` — opens Twitter/X share dialog with pre-filled text: `"I discovered my Athlete DNA — I'm an [ARCHETYPE] aligned with Team USA's [Sport] athletes! Discover yours → [URL] #TeamUSA #AthletesDNA #LA28"`

---

## API ROUTES — COMPLETE LIST

### `POST /api/conversation/start`
Input: `{ formData: FormData }`
Output: `{ question: string, options?: string[], type: string, conversationHistory: Message[] }`
Model: `gemini-2.5-pro`

### `POST /api/conversation/continue`
Input: `{ answer: string, conversationHistory: Message[] }`
Output: `{ question?: string, options?: string[], type?: string, done?: boolean, summary?: string, conversationHistory: Message[] }`
Model: `gemini-2.5-pro`

### `POST /api/classify`
Input: `{ formData: FormData, conversationSummary: string }`
Output: `ClassificationResult` (full archetype JSON — see schema above)
Model: `gemini-2.5-flash`
Also computes: biometric similarity scores against each sport's historical centroid (cosine similarity, computed in JS using pre-built centroid vectors from dataset)

### `POST /api/twins`
Input: `{ archetypeId: number, height: number, weight: number, sex: string, paralympicFirst: boolean }`
Output: `{ olympic: Athlete[], paralympic: Athlete[] }` — 3 each, equal
Loads from: `/data/usa_olympic_athletes.json` and `/data/usa_paralympic_athletes.json`
Also calls Gemini Flash to generate "DNA connection" narratives for each twin

### `POST /api/simulate`
Input: `{ sport: string, archetypeId: number }`
Output: `{ range: { min: number, max: number, unit: string }, historicalContext: string, distributionData: DataPoint[] }`
Loads historical performance ranges from `/data/sport_ranges.json` (pre-computed from dataset)

---

## STATE MANAGEMENT (Zustand)

```typescript
// /store/athleteStore.ts
interface AthleteStore {
  // Form data
  formData: {
    height_cm: number;
    weight_kg: number;
    age: number;
    sex: 'male' | 'female';
    dominant_side: 'left' | 'right' | 'ambidextrous';
    arm_span_cm: number;
    flexibility: 'limited' | 'average' | 'above_average' | 'hypermobile';
    build: 'lean' | 'athletic' | 'stocky' | 'tall_lean' | 'broad_powerful';
    resting_hr?: 'low' | 'average' | 'athlete';
    sports: string[];
    active_years: number;
    competition_level: 'recreational' | 'school' | 'club' | 'varsity' | 'elite';
    has_impairment: boolean;
    impairment_category?: string;
  };
  setFormData: (data: Partial<FormData>) => void;

  // Conversation
  conversationHistory: Message[];
  addMessage: (msg: Message) => void;
  conversationSummary: string;
  setConversationSummary: (s: string) => void;

  // Result
  classificationResult: ClassificationResult | null;
  setClassificationResult: (r: ClassificationResult) => void;

  // UI
  revealPhase: 0 | 1 | 2 | 3 | 4;
  setRevealPhase: (p: number) => void;
  selectedSport: string | null;
  setSelectedSport: (s: string) => void;

  // Computed
  paralympicFirst: boolean; // derived from formData.has_impairment
}
```

---

## FILE & FOLDER STRUCTURE

```
athlete-dna/
├── app/
│   ├── page.tsx                    # Landing
│   ├── intake/page.tsx             # Form
│   ├── conversation/page.tsx       # Gemini chat
│   ├── reveal/page.tsx             # Three.js reveal
│   ├── profile/page.tsx            # Dashboard (all 4 tabs)
│   ├── simulate/page.tsx           # Standalone simulation route
│   ├── api/
│   │   ├── conversation/
│   │   │   ├── start/route.ts
│   │   │   └── continue/route.ts
│   │   ├── classify/route.ts
│   │   ├── twins/route.ts
│   │   └── simulate/route.ts
│   ├── layout.tsx                  # Root layout, fonts, global styles
│   └── globals.css
├── components/
│   ├── three/
│   │   ├── DNAHelix.tsx
│   │   ├── AvatarScene.tsx
│   │   ├── ParticleCloud.tsx
│   │   ├── SimulationScene.tsx
│   │   └── PostEffects.tsx
│   ├── intake/
│   │   ├── Step1.tsx
│   │   ├── Step2.tsx
│   │   ├── Step3.tsx
│   │   └── ProgressBar.tsx
│   ├── profile/
│   │   ├── SportsTab.tsx
│   │   ├── TwinsTab.tsx
│   │   ├── SimulateTab.tsx
│   │   ├── AthleteCard.tsx
│   │   └── StatBars.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── SliderInput.tsx
│   │   ├── TagCloud.tsx
│   │   ├── ToggleCard.tsx
│   │   └── TypewriterText.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── PageTransition.tsx
├── store/
│   └── athleteStore.ts
├── lib/
│   ├── gemini.ts
│   ├── archetypes.ts
│   ├── similarity.ts
│   ├── dataLoader.ts
│   └── constants.ts
├── data/
│   ├── usa_olympic_athletes.json
│   ├── usa_paralympic_athletes.json
│   ├── archetype_centroids.json
│   └── sport_ranges.json
├── scripts/
│   └── preprocess-data.ts
├── public/
│   └── fonts/
├── Dockerfile
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## DOCKER & CLOUD RUN DEPLOYMENT

```dockerfile
# Dockerfile
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

In `next.config.ts`: set `output: 'standalone'`

**Deploy command:**
```bash
gcloud run deploy athlete-dna \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[YOUR_KEY]
```

---

## VISUAL DESIGN SYSTEM (original dark theme — superseded by editorial paper theme in `app/globals.css`)

**Original Colors:**
```
Background:       #0a0a0f
Surface:          #111118
Surface elevated: #1a1a2e
Border:           #ffffff15
Text primary:     #f8fafc
Text secondary:   #94a3b8
Gold accent:      #f59e0b
Blue accent:      #3b82f6
Purple accent:    #8b5cf6
```

The shipped app uses a lighter editorial paper theme; the live tokens are in `app/globals.css`. This block is preserved only as historical reference.

**Typography (original):**
- Headings: Space Grotesk (600, 700 weights)
- Body: Inter (400, 500 weights)
- Monospace: JetBrains Mono

**Animation Principles:**
- Page transitions: Framer Motion `<AnimatePresence>` with fade + slight Y movement
- Hover states: `whileHover={{ scale: 1.02 }}` on interactive cards
- Stagger children: `staggerChildren: 0.08` for list/grid items
- Three.js: target 60fps, use `useFrame` delta for frame-rate independence
- Avoid layout shifts — `min-height` on async-loaded containers

---

## PERFORMANCE REQUIREMENTS

- Landing page Three.js scene: must not block interactivity — load canvas after `DOMContentLoaded`
- Form page: NO Three.js — keep JS bundle small for fast TTI
- Reveal page: preload classification result in `/conversation` so reveal screen starts immediately
- Use `next/dynamic` with `{ ssr: false }` for ALL Three.js components (they are client-side only)
- Use `React.Suspense` with skeleton fallbacks for all data-dependent components
- Gemini API calls: never expose `GEMINI_API_KEY` to client — all calls through Next.js API routes

---

## BUILD ORDER RECOMMENDATION

For a 1-week solo build, build in this exact order to maximize demo quality:

1. **Day 1:** Project scaffold, Zustand store, form Steps 1-3 with all inputs working, routing between intake → conversation → reveal → profile
2. **Day 2:** Gemini API routes (classify + conversation), conversation screen with typewriter, full classification flow end-to-end with dummy reveal
3. **Day 3:** Reveal screen Three.js scene — particle cloud → avatar assembly → ignition → text. This is the hardest day. Time-box avatar to 4 hours; if behind, simplify to a glowing abstract humanoid shape.
4. **Day 4:** Profile dashboard — Sports tab and Twins tab with real data wired in from pre-processed JSON files
5. **Day 5:** Simulate tab — sprint simulation fully animated, at least 2 other sports as stubs, distribution bell curve
6. **Day 6:** Athlete Card with download, paralympic-first mode end-to-end, polish all transitions, loading states
7. **Day 7:** Docker + Cloud Run deployment, full demo run-throughs, record 3-minute demo video

---

## DEMO VIDEO REQUIREMENTS (per hackathon rules)

The 3-minute video must show:
1. Live demo of the full user journey (landing → form → conversation → reveal → profile tabs → simulation → card)
2. The Google Cloud console showing the Cloud Run service
3. The Gemini API call in action (show AI Studio or the code)
4. Paralympic pathway demonstration — actually go through the flow with an impairment selected
5. The athlete card download

Record in 1080p minimum. Add captions if audio isn't clear.

---

## FINAL NOTE TO CLAUDE CODE (original)

The visual quality of the Three.js reveal sequence and the simulation are the make-or-break moments of this hackathon demo. Judges will form their first impression in the first 10 seconds. The particle-to-avatar reveal sequence must feel cinematic and polished. If you are uncertain between implementing a feature quickly vs. implementing the Three.js reveal correctly — always prioritize the reveal. Everything else can be simplified, but that moment cannot.

Every screen transition should feel fluid. Every loading state should look designed. This is not a prototype — it is a finished product being judged by industry experts from Google.
