# Athlete DNA

A cinematic, full-stack experience for the **Google Cloud × Team USA Hackathon** (Challenge 4: The Athlete Archetype Agent).

Users input their biometrics → Gemini 2.5 conversationally sharpens the profile → a Three.js cinematic reveal assigns one of **8 Athlete Archetypes** drawn from 120 years of Team USA history → a profile dashboard surfaces both Olympic and Paralympic sport pathways with equal analytical depth, plus historical "twin" athletes, sport simulations, and a shareable card.

## Stack

- **Next.js 16.2 (App Router, Turbopack)** + **React 19.2** + **TypeScript** strict mode
- **Tailwind CSS v4** for all styling (CSS-first `@theme`, no config file)
- **Framer Motion v12** for transitions and stagger
- **React Three Fiber v9** + **drei** + **postprocessing** for all 3D scenes
- **Zustand v5** with `persist` middleware (sessionStorage)
- **Recharts** for the simulation distribution chart
- **html2canvas** for the athlete card download
- **Gemini 2.5 Pro** (conversation) and **Gemini 2.5 Flash** (classification, twins narratives) via `@google/generative-ai`
- **Docker → Google Cloud Run** for deployment

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # add your GEMINI_API_KEY
pnpm dev                            # http://localhost:3000
```

> The app degrades gracefully without `GEMINI_API_KEY`: API routes fall back to heuristic classification and seeded twin narratives so judges can still walk the full flow.

## Project layout

```
app/
  page.tsx               Landing (DNA helix scene)
  intake/                3-step biometric form
  conversation/          Gemini multi-turn chat
  reveal/                Three.js cinematic 4-phase reveal
  profile/               4-tab dashboard (Sports / Twins / Simulate / Card)
  simulate/              Standalone sport simulation route
  api/
    conversation/start   POST — Gemini Pro, first question
    conversation/continue POST — Gemini Pro, multi-turn
    classify             POST — Gemini Flash + cosine similarity
    twins                POST — JSON match + Gemini Flash narratives
    simulate             POST — historical archetype range + bell curve
components/
  three/    DNAHelix · ParticleCloud · AvatarScene · SimulationScene · PostEffects
  ui/       Button · SliderInput · TagCloud · ToggleCard · TypewriterText
  intake/   Step1–3 · ProgressBar · SilhouettePreview
  profile/  SportsTab · TwinsTab · SimulateTab · AthleteCard · StatBars
  layout/   Navbar · PageTransition
lib/        gemini · archetypes · similarity · dataLoader · constants
data/       archetype_centroids · sport_ranges · usa_olympic_athletes · usa_paralympic_athletes
store/      athleteStore (Zustand + persist)
```

## The 8 Archetypes

| # | Name | Color |
|---|------|-------|
| 1 | EXPLOSIVE POWERHOUSE ⚡ | `#ef4444` |
| 2 | AEROBIC ENGINE 🌊 | `#06b6d4` |
| 3 | PRECISION ARTIST 🎯 | `#8b5cf6` |
| 4 | VERSATILE DYNAMO 🔄 | `#f59e0b` |
| 5 | STRENGTH ANCHOR 💪 | `#f97316` |
| 6 | REACTIVE SPEEDSTER 🚀 | `#22c55e` |
| 7 | KINETIC CONTROLLER 🧘 | `#ec4899` |
| 8 | ADAPTIVE WARRIOR 🌍 | `#f59e0b` (Paralympic-primary) |

## Olympic + Paralympic Parity

A judging criterion: every Paralympic surface — sport cards, twin cards, simulation, athlete card — uses **identical visual weight** to its Olympic counterpart. When the user reports an impairment, `paralympicFirst` is set: the Paralympic column is reordered first and visually emphasized.

## Conditional language

All hardcoded strings and Gemini prompts use only conditional language (*"could," "may," "historically associated with," "athletes with this profile have"*). No instance of *"you will," "your performance," "you would achieve."* This is enforced at every layer — system prompts, fallback strings, sport blurbs, twin narratives, and the simulation chart caption.

## Deployment

```bash
docker build -t athlete-dna .
docker run -p 3000:3000 -e GEMINI_API_KEY=$GEMINI_API_KEY athlete-dna

# Or directly to Cloud Run:
gcloud run deploy athlete-dna \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY
```

## License

Apache License 2.0 — see `LICENSE`.
