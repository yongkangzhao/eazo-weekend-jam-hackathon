"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/* ── Types ──────────────────────────────────────────────── */

interface Phase {
  yearRange: string;
  title: string;
  description: string;
  imagePrompt: string;
  audioMood: string;
}

interface PhaseWithImage extends Phase {
  imageUrl: string | null;
  imageLoading: boolean;
  imageError: string | null;
}

interface Timeline {
  name: string;
  phases: Phase[];
}

/* ── Sample profile for the "Try Demo" button ──────────── */

const SAMPLE_PROFILE = `Jane Chen
San Francisco Bay Area

Experience:
- Senior Machine Learning Engineer at Anthropic (2023 - Present)
  Leading safety research on large language models.
- ML Engineer at Google DeepMind (2019 - 2023)
  Worked on reinforcement learning for robotics.
- Software Engineer at Stripe (2016 - 2019)
  Built fraud detection systems using ML.
- Intern at Microsoft Research (Summer 2015)
  Research on natural language understanding.

Education:
- M.S. Computer Science, Stanford University (2014 - 2016)
  Focus: Artificial Intelligence & NLP
- B.S. Computer Science, UC Berkeley (2010 - 2014)
  Minor in Cognitive Science

Grew up in Portland, Oregon. Passionate about AI safety, hiking, and film photography.`;

/* ── Shimmer placeholder ───────────────────────────────── */

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] ${className ?? ""}`}
      style={{
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

/* ── Phase card component ──────────────────────────────── */

function PhaseCard({
  phase,
  index,
  isVisible,
}: {
  phase: PhaseWithImage;
  index: number;
  isVisible: boolean;
}) {
  const isLeft = index % 2 === 0;
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col md:flex-row items-center gap-6 md:gap-10 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      {/* Timeline dot */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center z-10">
        <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-gray-950 shadow-lg shadow-indigo-500/30" />
      </div>

      {/* Image side */}
      <div className={`w-full md:w-[calc(50%-2.5rem)] ${isLeft ? "md:text-right" : "md:text-left"}`}>
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl">
          {phase.imageLoading ? (
            <ShimmerBlock className="absolute inset-0" />
          ) : phase.imageUrl ? (
            <img
              src={phase.imageUrl}
              alt={phase.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-600 text-sm">
              {phase.imageError ?? "Image unavailable"}
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
        </div>
      </div>

      {/* Text side */}
      <div className={`w-full md:w-[calc(50%-2.5rem)] ${isLeft ? "" : ""}`}>
        {/* Year badge */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
          {phase.yearRange}
        </span>
        <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2 leading-tight">
          {phase.title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm md:text-base">
          {phase.description}
        </p>
        <p className="mt-2 text-xs text-gray-600 italic">
          {phase.audioMood}
        </p>
      </div>
    </div>
  );
}

/* ── Skeleton for loading state ────────────────────────── */

function TimelineSkeleton() {
  return (
    <div className="space-y-16 mt-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex flex-col md:flex-row items-center gap-6 md:gap-10 ${
            i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
          }`}
        >
          <div className="w-full md:w-[calc(50%-2.5rem)]">
            <ShimmerBlock className="aspect-[16/10]" />
          </div>
          <div className="w-full md:w-[calc(50%-2.5rem)] space-y-3">
            <ShimmerBlock className="h-6 w-24" />
            <ShimmerBlock className="h-8 w-3/4" />
            <ShimmerBlock className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main page component ───────────────────────────────── */

export default function MemoryStreamPage() {
  const [profileText, setProfileText] = useState("");
  const [phases, setPhases] = useState<PhaseWithImage[]>([]);
  const [personName, setPersonName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visiblePhases, setVisiblePhases] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);

  // Stagger-reveal phases as they are added
  useEffect(() => {
    if (phases.length === 0) return;
    const timer = setTimeout(() => {
      setVisiblePhases((prev) => {
        const next = new Set(prev);
        // Reveal the next unrevealed phase
        for (let i = 0; i < phases.length; i++) {
          if (!next.has(i)) {
            next.add(i);
            break;
          }
        }
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [phases, visiblePhases]);

  const generateImage = useCallback(
    async (index: number, prompt: string) => {
      setPhases((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], imageLoading: true };
        }
        return updated;
      });

      try {
        const res = await fetch("/api/memory-stream/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Image generation failed");
        }

        const data = await res.json();
        setPhases((prev) => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              imageUrl: data.imageUrl,
              imageLoading: false,
            };
          }
          return updated;
        });
      } catch (err) {
        setPhases((prev) => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              imageLoading: false,
              imageError:
                err instanceof Error ? err.message : "Failed to load image",
            };
          }
          return updated;
        });
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!profileText.trim()) return;

    setGenerating(true);
    setError(null);
    setPhases([]);
    setPersonName(null);
    setVisiblePhases(new Set());

    try {
      // Step 1: Generate the timeline
      const res = await fetch("/api/memory-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate timeline");
      }

      const timeline: Timeline = await res.json();
      setPersonName(timeline.name);

      // Step 2: Set up phases with loading state and generate images one by one
      const initialPhases: PhaseWithImage[] = timeline.phases.map((p) => ({
        ...p,
        imageUrl: null,
        imageLoading: true,
        imageError: null,
      }));
      setPhases(initialPhases);

      // Scroll to timeline
      setTimeout(() => {
        timelineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 400);

      // Step 3: Generate images sequentially so user sees progress
      for (let i = 0; i < timeline.phases.length; i++) {
        // Don't await — fire and let state updates handle display
        // But do it sequentially for a nice reveal effect
        await generateImage(i, timeline.phases[i].imagePrompt);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setGenerating(false);
    }
  }, [profileText, generateImage]);

  const handleTryDemo = useCallback(() => {
    setProfileText(SAMPLE_PROFILE);
  }, []);

  const showTimeline = phases.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Back link */}
        <a
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1.5 mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Gallery
        </a>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Memory Stream
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Paste your LinkedIn profile and watch your life story unfold as a
            cinematic memory stream — with AI-generated visuals.
          </p>
        </div>

        {/* Input section */}
        {!showTimeline && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-gray-800/50 bg-gray-900/50 backdrop-blur-sm p-6 shadow-xl">
              <label
                htmlFor="profile-input"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                LinkedIn Profile Text
              </label>
              <textarea
                id="profile-input"
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder={`Paste your LinkedIn profile here...\n\nInclude your name, education, work history, locations, and any other details you'd like to see in your memory stream.`}
                rows={10}
                className="w-full rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-3 text-gray-100 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/25 resize-none text-sm leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !profileText.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Reconstructing Memories...
                    </span>
                  ) : (
                    "Generate Memory Stream"
                  )}
                </button>
                <button
                  onClick={handleTryDemo}
                  disabled={generating}
                  className="rounded-xl border border-gray-700 px-6 py-3 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Try Demo Profile
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-600 mt-4">
              Your profile text is processed by AI to create a fictional
              narrative. No data is stored.
            </p>
          </div>
        )}

        {/* Generating skeleton */}
        {generating && !showTimeline && <TimelineSkeleton />}

        {/* Error state */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6 rounded-xl bg-red-900/20 border border-red-800/50 p-4 text-red-300 text-sm">
            <p className="font-medium mb-1">Generation failed</p>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-500 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && (
          <div ref={timelineRef}>
            {/* Person name header */}
            {personName && (
              <div className="text-center mb-12 animate-fade-in">
                <p className="text-sm text-indigo-400 uppercase tracking-widest mb-2">
                  The Memory Stream of
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-100">
                  {personName}
                </h2>
              </div>
            )}

            {/* Reset button */}
            <div className="text-center mb-10">
              <button
                onClick={() => {
                  setPhases([]);
                  setPersonName(null);
                  setVisiblePhases(new Set());
                }}
                className="text-sm text-gray-500 hover:text-gray-300 underline transition-colors"
              >
                Start over with a new profile
              </button>
            </div>

            {/* Vertical timeline line (desktop only) */}
            <div className="relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-purple-500/30 to-transparent" />

              {/* Phase cards */}
              <div className="space-y-16 md:space-y-24">
                {phases.map((phase, i) => (
                  <PhaseCard
                    key={i}
                    phase={phase}
                    index={i}
                    isVisible={visiblePhases.has(i)}
                  />
                ))}
              </div>

              {/* End marker */}
              {!generating && (
                <div className="flex justify-center mt-16">
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500/50 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 italic">
                      The stream continues...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
