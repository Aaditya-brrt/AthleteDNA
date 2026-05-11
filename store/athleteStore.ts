// Licensed under the Apache License, Version 2.0
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EraWalkData } from "@/lib/eraWalk";

export interface FormData {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: "male" | "female";
  dominant_side: "left" | "right" | "ambidextrous";
  arm_span_cm: number;
  flexibility: "limited" | "average" | "above_average" | "hypermobile";
  build: "lean" | "athletic" | "stocky" | "tall_lean" | "broad_powerful";
  resting_hr?: "low" | "average" | "athlete";
  sports: string[];
  active_years: number;
  competition_level: "recreational" | "school" | "club" | "varsity" | "elite";
  has_impairment: boolean;
  impairment_category?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface SportMatch {
  name: string;
  match_percent: number;
  blurb: string;
  pathway: "olympic" | "paralympic";
}

export interface ClassificationResult {
  archetype: string;
  archetype_id: number;
  tagline: string;
  stats: { power: number; endurance: number; precision: number };
  olympic_sports: SportMatch[];
  paralympic_sports: SportMatch[];
  reasoning: string;
  paralympic_first: boolean;
  athlete_story?: string;
}

export interface TwinAthlete {
  // No athlete names on the client. `code` is a server-assembled cohort handle
  // (pathway · year · discipline · roster letter).
  code: string;
  sport: string;
  event: string;
  year: number;
  games: string;
  medal?: string;
  height_cm?: number;
  weight_kg?: number;
  similarity_percent: number;
  dna_connection: string;
  pathway: "olympic" | "paralympic";
}

interface AthleteStore {
  formData: Partial<FormData>;
  setFormData: (data: Partial<FormData>) => void;
  resetFormData: () => void;

  conversationHistory: Message[];
  addMessage: (msg: Message) => void;
  setConversationHistory: (history: Message[]) => void;
  conversationSummary: string;
  setConversationSummary: (s: string) => void;

  classificationResult: ClassificationResult | null;
  setClassificationResult: (r: ClassificationResult | null) => void;

  twins: { olympic: TwinAthlete[]; paralympic: TwinAthlete[] } | null;
  setTwins: (t: { olympic: TwinAthlete[]; paralympic: TwinAthlete[] } | null) => void;

  revealPhase: 0 | 1 | 2 | 3 | 4;
  setRevealPhase: (p: 0 | 1 | 2 | 3 | 4) => void;

  selectedSport: string | null;
  setSelectedSport: (s: string | null) => void;

  eraWalk: EraWalkData | null;
  setEraWalk: (e: EraWalkData | null) => void;

  paralympicFirst: () => boolean;
}

const DEFAULT_FORM: Partial<FormData> = {
  height_cm: 178,
  weight_kg: 75,
  age: 25,
  sex: "male",
  dominant_side: "right",
  arm_span_cm: 178,
  sports: [],
  active_years: 5,
  has_impairment: false,
};

export const useAthleteStore = create<AthleteStore>()(
  persist(
    (set, get) => ({
      formData: DEFAULT_FORM,
      setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
      resetFormData: () => set({ formData: DEFAULT_FORM }),

      conversationHistory: [],
      addMessage: (msg) => set((state) => ({ conversationHistory: [...state.conversationHistory, msg] })),
      setConversationHistory: (history) => set({ conversationHistory: history }),
      conversationSummary: "",
      setConversationSummary: (s) => set({ conversationSummary: s }),

      classificationResult: null,
      setClassificationResult: (r) => set({ classificationResult: r }),

      twins: null,
      setTwins: (t) => set({ twins: t }),

      revealPhase: 0,
      setRevealPhase: (p) => set({ revealPhase: p }),

      selectedSport: null,
      setSelectedSport: (s) => set({ selectedSport: s }),

      eraWalk: null,
      setEraWalk: (e) => set({ eraWalk: e }),

      paralympicFirst: () => Boolean(get().formData.has_impairment),
    }),
    {
      name: "athlete-dna-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        formData: state.formData,
        conversationHistory: state.conversationHistory,
        conversationSummary: state.conversationSummary,
        classificationResult: state.classificationResult,
        twins: state.twins,
        selectedSport: state.selectedSport,
        eraWalk: state.eraWalk,
      }),
    }
  )
);
