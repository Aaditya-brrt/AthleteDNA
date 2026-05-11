// Licensed under the Apache License, Version 2.0
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAthleteStore } from "@/store/athleteStore";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { Navbar } from "@/components/layout/Navbar";

interface Question {
  question: string;
  options?: string[];
  type?: "select" | "text";
}

interface ConversationResponse extends Question {
  done?: boolean;
  summary?: string;
  conversationHistory: { role: "user" | "model"; parts: { text: string }[] }[];
}

export default function ConversationPage() {
  const router = useRouter();
  const {
    formData,
    setConversationHistory,
    setConversationSummary,
    setClassificationResult,
    setEraWalk,
    setTwins,
  } = useAthleteStore();

  const [history, setHistoryLocal] = useState<{ role: "user" | "model"; parts: { text: string }[] }[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [textInput, setTextInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Echo of the just-clicked answer so the UI can paint instant feedback
  // (highlighted button + "Reading your answer…" line) before the Gemini
  // round-trip resolves. Cleared when the next question arrives.
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [phase, setPhase] = useState<"asking" | "classifying" | "done">("asking");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [classifyingMessage, setClassifyingMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/conversation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData }),
    })
      .then((r) => r.json())
      .then((data: ConversationResponse) => {
        if (!mounted) return;
        if (data.done) {
          finalize(data.summary ?? "");
          return;
        }
        setCurrent({ question: data.question ?? "", options: data.options, type: data.type });
        setHistoryLocal(data.conversationHistory ?? []);
      })
      .catch((e) => {
        console.error(e);
        finalize("Profile gathered.");
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finalize(summary: string) {
    setPhase("classifying");
    setClassifyingMessage("Analyzing your Athlete DNA…");
    setConversationSummary(summary);
    try {
      // Single Gemini call returns archetype + eraWalk + twins.
      // Corridor + TwinsTab read all three from the store afterwards.
      const res = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, conversationSummary: summary }),
      });
      const dossier = await res.json();
      if (dossier?.classification) setClassificationResult(dossier.classification);
      if (dossier?.eraWalk) setEraWalk(dossier.eraWalk);
      if (dossier?.twins) setTwins(dossier.twins);
      setClassifyingMessage("DNA mapped. Preparing reveal…");
      setTimeout(() => router.push("/reveal"), 800);
    } catch (e) {
      console.error(e);
      router.push("/reveal");
    }
  }

  async function submitAnswer(answer: string) {
    if (!answer.trim()) return;
    // Paint immediately: mark the selected answer, clear text field, lock UI.
    // The fetch below blocks for ~1-3s on Gemini; without these flips the
    // click feels dead and users multi-click.
    setPendingAnswer(answer);
    setSubmitting(true);
    setTextInput("");
    try {
      const res = await fetch("/api/conversation/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, conversationHistory: history }),
      });
      const data: ConversationResponse = await res.json();
      setHistoryLocal(data.conversationHistory ?? []);
      setConversationHistory(
        (data.conversationHistory ?? []).map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.parts.map((p) => p.text).join("\n"),
        }))
      );
      if (data.done) {
        finalize(data.summary ?? "");
        return;
      }
      setCurrent({ question: data.question ?? "", options: data.options, type: data.type });
      setQuestionIndex((i) => i + 1);
      setPendingAnswer(null);
    } catch (e) {
      console.error(e);
      finalize("Profile gathered.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#FDFBF7] grid-bg overflow-hidden">
      <Navbar
        rightSlot={
          <div className="kicker flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#BF0A30] animate-pulse" />
            <span>Gemini Analyzing</span>
          </div>
        }
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-24 kicker text-[#52525B]">
        Stage 03 of 04 · Profiling
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait">
            {phase === "asking" && current && (
              <motion.div
                key={`q-${questionIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-3">
                  <hr className="w-12 rule-bold" />
                  <span className="kicker">Question {String(questionIndex + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight min-h-[120px]">
                  <TypewriterText text={current.question} delay={25} />
                </h2>

                {current.type === "select" && current.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    {current.options.map((opt, i) => {
                      const isPicked = pendingAnswer === opt;
                      const isDimmed = submitting && !isPicked;
                      return (
                        <motion.button
                          key={opt}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: isDimmed ? 0.35 : 1, y: 0 }}
                          transition={{ delay: submitting ? 0 : i * 0.06 }}
                          whileTap={{ scale: 0.99 }}
                          disabled={submitting}
                          onClick={() => submitAnswer(opt)}
                          className={`text-left p-4 transition-colors group ${
                            isPicked
                              ? "bg-[#0A2240] text-[#FDFBF7] border border-[#0A2240]"
                              : "bg-[#FFFFFF] border border-[#E4E4E7] hover:border-[#0B0B0F]"
                          } disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono text-[10px] tracking-wider ${
                                isPicked
                                  ? "text-[#A88134]"
                                  : "text-[#52525B] group-hover:text-[#BF0A30]"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="font-light text-[15px]">{opt}</span>
                            {isPicked && (
                              <span className="ml-auto kicker text-[10px] text-[#A88134]">
                                Picked
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {(current.type === "text" || !current.options) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAnswer(textInput);
                    }}
                    className="flex gap-2 pt-2"
                  >
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      autoFocus
                      disabled={submitting}
                      placeholder={submitting && pendingAnswer ? pendingAnswer : "Type your answer…"}
                      className="flex-1 p-4 bg-[#FFFFFF] border border-[#E4E4E7] focus:border-[#0B0B0F] focus:outline-none font-mono text-sm placeholder:text-[#52525B]/60 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !textInput.trim()}
                      className="px-6 text-xs font-semibold uppercase tracking-[0.12em] bg-[#0A2240] text-[#FDFBF7] hover:bg-[#BF0A30] disabled:opacity-40 transition-colors"
                    >
                      Send →
                    </button>
                  </form>
                )}

                {/* Instant feedback strip — paints the moment the user clicks.
                    Keeps the page feeling responsive while Gemini composes the
                    next question (typically 1-3 seconds). */}
                {submitting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 pt-2"
                  >
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#0A2240] animate-pulse" />
                      <span
                        className="w-1.5 h-1.5 bg-[#0A2240] animate-pulse"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-[#0A2240] animate-pulse"
                        style={{ animationDelay: "240ms" }}
                      />
                    </span>
                    <span className="kicker text-[#52525B]">
                      Reading your answer · composing next question
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase === "classifying" && (
              <motion.div
                key="classifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-[#0A2240] border-t-transparent animate-spin" />
                  </div>
                  <h3 className="font-display text-3xl font-semibold">{classifyingMessage}</h3>
                  <div className="kicker">Powered by Gemini 2.5 Flash</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center kicker text-[#52525B]">
        Powered by Gemini 2.5 · Athlete DNA
      </div>
    </main>
  );
}
