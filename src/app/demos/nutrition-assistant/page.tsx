"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FoodItem {
  name: string;
  calories: number;
  confidence: number;
}

interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  macros: Macros;
  recommendation: string;
  shouldEat: boolean;
}

type HealthGoal = "weight-loss" | "muscle-gain" | "maintenance";

// ─── Image compression utility ───────────────────────────────────────────────

function compressImage(file: File, maxSize = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Strip the data:image/jpeg;base64, prefix
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Mascot SVG Component ───────────────────────────────────────────────────

type MascotMood = "happy" | "excited" | "thinking";

function Mascot({ mood = "happy", size = 80 }: { mood?: MascotMood; size?: number }) {
  const mouthPaths: Record<MascotMood, React.ReactNode> = {
    happy: (
      <path d="M35 52 Q42 60 49 52" stroke="#2E7D32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    ),
    excited: (
      <ellipse cx="42" cy="54" rx="6" ry="4" fill="#2E7D32" />
    ),
    thinking: (
      <path d="M36 54 Q42 50 48 54" stroke="#2E7D32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    ),
  };

  const leftBrow = mood === "thinking" ? (
    <line x1="30" y1="32" x2="36" y2="30" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
  ) : null;

  return (
    <svg width={size} height={size} viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="42" cy="46" rx="28" ry="30" fill="#66BB6A" />
      {/* Leaf / stem on top */}
      <ellipse cx="42" cy="16" rx="4" ry="8" fill="#4CAF50" transform="rotate(-15 42 16)" />
      <ellipse cx="48" cy="14" rx="3" ry="7" fill="#81C784" transform="rotate(20 48 14)" />
      {/* Eyes */}
      <circle cx="33" cy="40" r="5" fill="white" />
      <circle cx="51" cy="40" r="5" fill="white" />
      <circle cx={mood === "thinking" ? "34" : "33"} cy="40" r="2.5" fill="#1B5E20" />
      <circle cx={mood === "thinking" ? "52" : "51"} cy="40" r="2.5" fill="#1B5E20" />
      {/* Eye shine */}
      <circle cx="32" cy="38.5" r="1" fill="white" />
      <circle cx="50" cy="38.5" r="1" fill="white" />
      {/* Brow for thinking */}
      {leftBrow}
      {/* Mouth */}
      {mouthPaths[mood]}
      {/* Cheeks */}
      <circle cx="26" cy="48" r="4" fill="#C8E6C9" opacity="0.6" />
      <circle cx="58" cy="48" r="4" fill="#C8E6C9" opacity="0.6" />
    </svg>
  );
}

// ─── Health goal options ─────────────────────────────────────────────────────

const HEALTH_GOALS: { value: HealthGoal; label: string; subtitle: string; icon: string }[] = [
  { value: "weight-loss", label: "Weight Loss", subtitle: "Burn, baby, burn", icon: "\uD83D\uDD25" },
  { value: "muscle-gain", label: "Muscle Gain", subtitle: "Gains incoming", icon: "\uD83D\uDCAA" },
  { value: "maintenance", label: "Maintenance", subtitle: "Steady as she goes", icon: "\u2696\uFE0F" },
];

// ─── Food emoji helper ──────────────────────────────────────────────────────

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("chicken") || lower.includes("meat") || lower.includes("steak")) return "\uD83C\uDF57";
  if (lower.includes("rice")) return "\uD83C\uDF5A";
  if (lower.includes("salad") || lower.includes("vegetable") || lower.includes("broccoli")) return "\uD83E\uDD57";
  if (lower.includes("bread") || lower.includes("toast")) return "\uD83C\uDF5E";
  if (lower.includes("egg")) return "\uD83E\uDD5A";
  if (lower.includes("fish") || lower.includes("salmon") || lower.includes("tuna")) return "\uD83C\uDF1F";
  if (lower.includes("pasta") || lower.includes("noodle") || lower.includes("spaghetti")) return "\uD83C\uDF5D";
  if (lower.includes("pizza")) return "\uD83C\uDF55";
  if (lower.includes("burger") || lower.includes("hamburger")) return "\uD83C\uDF54";
  if (lower.includes("fruit") || lower.includes("apple") || lower.includes("banana")) return "\uD83C\uDF4E";
  if (lower.includes("soup")) return "\uD83C\uDF72";
  if (lower.includes("sandwich")) return "\uD83E\uDD6A";
  if (lower.includes("cheese")) return "\uD83E\uDDC0";
  if (lower.includes("fries") || lower.includes("potato")) return "\uD83C\uDF5F";
  return "\uD83C\uDF7D\uFE0F";
}

// ─── CSS Keyframes (injected via style tag) ─────────────────────────────────

const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.15);
  }
}
@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
@keyframes confetti {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) rotate(180deg);
  }
}
@keyframes floatMascot {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.animate-fadeInUp {
  animation: fadeInUp 0.5s ease-out both;
}
.animate-sparkle {
  animation: sparkle 1.5s ease-in-out infinite;
}
.animate-bounce-btn:hover {
  animation: bounce 0.3s ease-in-out;
}
.animate-confetti {
  animation: confetti 1.2s ease-out both;
}
.animate-float-mascot {
  animation: floatMascot 3s ease-in-out infinite;
}
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function NutritionAssistantPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [healthGoal, setHealthGoal] = useState<HealthGoal>("maintenance");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setShowXP(false);

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const base64 = await compressImage(file);
      setImageBase64(base64);
    } catch {
      setError("Failed to process image. Please try another file.");
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowXP(false);

    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, healthGoal }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
      // Trigger XP animation
      setTimeout(() => setShowXP(true), 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [imageBase64, healthGoal]);

  const handleSpeak = useCallback(async () => {
    if (!result?.recommendation) return;

    setSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.recommendation }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Speech generation failed");
      }

      const audioData = data.audio;
      if (audioData) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      } else {
        const utterance = new SpeechSynthesisUtterance(result.recommendation);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      const utterance = new SpeechSynthesisUtterance(result.recommendation);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, [result]);

  const handleReset = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setShowXP(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const totalMacroGrams = result
    ? result.macros.protein + result.macros.carbs + result.macros.fat
    : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="min-h-screen text-[#1C1E21]" style={{ backgroundColor: "#F8F7F4" }}>
        <div className="max-w-lg mx-auto px-4 py-8">

          {/* ── Streak / Points Bar ─────────────────────────────────────── */}
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-3 mb-6"
            style={{ backgroundColor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{"\uD83D\uDD25"}</span>
              <div>
                <p className="text-sm font-bold text-[#1C1E21]">Day 3 streak</p>
                <p className="text-xs text-gray-400">Keep it going!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#4CAF50]">Level 2</p>
                <p className="text-xs text-gray-400">Foodie</p>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: "#FFB74D" }}
              >
                {"\u2B50"}
              </div>
            </div>
          </div>

          {/* ── Progress Bar ────────────────────────────────────────────── */}
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Today&apos;s meals</span>
              <span className="text-xs font-bold text-[#4CAF50]">3 / 5 logged</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#E8F5E9" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: "60%", backgroundColor: "#66BB6A" }}
              />
            </div>
          </div>

          {/* ── Header with mascot ──────────────────────────────────────── */}
          <div className="text-center mb-6">
            <div className="animate-float-mascot inline-block mb-2">
              <Mascot mood={result ? (result.shouldEat ? "excited" : "thinking") : "happy"} size={72} />
            </div>
            <h1 className="text-2xl font-bold text-[#1C1E21] mb-1">
              Nutrition Assistant
            </h1>
            <p className="text-gray-400 text-sm">
              {result
                ? (result.shouldEat ? "Great choice! Here are your results." : "Let\u2019s take a look at the details.")
                : "Snap your meal and let\u2019s see what you\u2019re eating!"}
            </p>
          </div>

          {/* ── Image Upload Area ───────────────────────────────────────── */}
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-3xl transition-all flex flex-col items-center justify-center gap-4 cursor-pointer mb-6 group"
              style={{
                backgroundColor: "white",
                border: "3px dashed #66BB6A",
                boxShadow: "0 4px 20px rgba(76,175,80,0.08)",
              }}
            >
              <div className="relative">
                <Mascot mood="happy" size={90} />
                {/* Plate the mascot is holding */}
                <svg width="40" height="20" viewBox="0 0 40 20" className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <ellipse cx="20" cy="10" rx="18" ry="8" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="1.5" />
                  <ellipse cx="20" cy="8" rx="12" ry="5" fill="#C8E6C9" opacity="0.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[#1C1E21] group-hover:text-[#4CAF50] transition-colors">
                  Let&apos;s see what you&apos;re eating!
                </p>
                <p className="text-xs text-gray-400 mt-1">Tap to snap a photo or upload an image</p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-transform group-hover:scale-105"
                style={{ backgroundColor: "#4CAF50" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Snap Meal
              </div>
            </button>
          ) : (
            <div className="relative mb-6 animate-fadeInUp">
              <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full object-cover max-h-80"
                />
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1C1E21] transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* ── Health Goal Selector ────────────────────────────────────── */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-500 mb-3 px-1">
              Your Health Goal
            </label>
            <div className="grid grid-cols-3 gap-3">
              {HEALTH_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setHealthGoal(goal.value)}
                  className="flex flex-col items-center gap-1 py-4 px-2 rounded-2xl text-center transition-all duration-200"
                  style={{
                    backgroundColor: healthGoal === goal.value ? "#E8F5E9" : "white",
                    border: healthGoal === goal.value ? "2px solid #4CAF50" : "2px solid transparent",
                    boxShadow: healthGoal === goal.value
                      ? "0 4px 16px rgba(76,175,80,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                    transform: healthGoal === goal.value ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="text-sm font-bold text-[#1C1E21]">{goal.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{goal.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Analyze Button ──────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!imageBase64 || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white mb-6 animate-bounce-btn flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#4CAF50",
              boxShadow: !imageBase64 || loading ? "none" : "0 6px 20px rgba(76,175,80,0.3)",
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing your meal...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Analyze Food
              </>
            )}
          </button>

          {/* ── Error Message ───────────────────────────────────────────── */}
          {error && (
            <div
              className="mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 animate-fadeInUp"
              style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
            >
              <span className="text-lg shrink-0">{"\uD83D\uDE1F"}</span>
              {error}
            </div>
          )}

          {/* ── Loading Skeleton ────────────────────────────────────────── */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 rounded-2xl" style={{ backgroundColor: "#E8F5E9" }} />
              <div className="h-36 rounded-2xl" style={{ backgroundColor: "#E8F5E9" }} />
              <div className="h-24 rounded-2xl" style={{ backgroundColor: "#E8F5E9" }} />
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────────── */}
          {result && !loading && (
            <div className="space-y-4">

              {/* XP Banner */}
              {showXP && (
                <div
                  className="rounded-2xl p-4 flex items-center justify-center gap-3 animate-fadeInUp"
                  style={{ backgroundColor: "#FFF9C4" }}
                >
                  <span className="text-2xl animate-sparkle">{"\u2728"}</span>
                  <span className="text-lg font-bold" style={{ color: "#F57F17" }}>+50 XP earned!</span>
                  <span className="text-2xl animate-sparkle">{"\u2728"}</span>
                </div>
              )}

              {/* Foods Detected */}
              <div
                className="rounded-3xl p-5 animate-fadeInUp"
                style={{ backgroundColor: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animationDelay: "0.1s" }}
              >
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Foods Detected
                </h2>
                <div className="space-y-2">
                  {result.foods.map((food, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl"
                      style={{ backgroundColor: "#FAFAF8" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFoodEmoji(food.name)}</span>
                        <div>
                          <span className="text-sm font-semibold text-[#1C1E21]">{food.name}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {Math.round(food.confidence * 100)}% match
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#4CAF50" }}>
                        {food.calories} cal
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 flex justify-between" style={{ borderTop: "2px dashed #E8F5E9" }}>
                  <span className="text-sm font-bold text-[#1C1E21]">Total</span>
                  <span className="text-base font-bold" style={{ color: "#4CAF50" }}>
                    {result.totalCalories} cal
                  </span>
                </div>
              </div>

              {/* Macro Breakdown */}
              <div
                className="rounded-3xl p-5 animate-fadeInUp"
                style={{ backgroundColor: "white", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animationDelay: "0.2s" }}
              >
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Macro Breakdown
                </h2>
                <div className="space-y-4">
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#CE93D8" }} />
                        Protein
                      </span>
                      <span className="text-gray-500 font-medium">
                        {result.macros.protein}g
                        {totalMacroGrams > 0 &&
                          ` (${Math.round((result.macros.protein / totalMacroGrams) * 100)}%)`}
                      </span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#F3E5F5" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: totalMacroGrams > 0
                            ? `${(result.macros.protein / totalMacroGrams) * 100}%`
                            : "0%",
                          backgroundColor: "#CE93D8",
                        }}
                      />
                    </div>
                  </div>
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#FFD54F" }} />
                        Carbs
                      </span>
                      <span className="text-gray-500 font-medium">
                        {result.macros.carbs}g
                        {totalMacroGrams > 0 &&
                          ` (${Math.round((result.macros.carbs / totalMacroGrams) * 100)}%)`}
                      </span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#FFF9C4" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: totalMacroGrams > 0
                            ? `${(result.macros.carbs / totalMacroGrams) * 100}%`
                            : "0%",
                          backgroundColor: "#FFD54F",
                        }}
                      />
                    </div>
                  </div>
                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#FFB74D" }} />
                        Fat
                      </span>
                      <span className="text-gray-500 font-medium">
                        {result.macros.fat}g
                        {totalMacroGrams > 0 &&
                          ` (${Math.round((result.macros.fat / totalMacroGrams) * 100)}%)`}
                      </span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: "#FFF3E0" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: totalMacroGrams > 0
                            ? `${(result.macros.fat / totalMacroGrams) * 100}%`
                            : "0%",
                          backgroundColor: "#FFB74D",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div
                className="rounded-3xl p-5 animate-fadeInUp"
                style={{
                  backgroundColor: result.shouldEat ? "#E8F5E9" : "#FFF9C4",
                  border: result.shouldEat ? "2px solid #C8E6C9" : "2px solid #FFF176",
                  animationDelay: "0.3s",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 pt-0.5">
                    <Mascot mood={result.shouldEat ? "excited" : "thinking"} size={48} />
                  </div>
                  <div className="flex-1">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-2"
                      style={{
                        backgroundColor: result.shouldEat ? "#C8E6C9" : "#FFF9C4",
                        color: result.shouldEat ? "#1B5E20" : "#F57F17",
                      }}
                    >
                      {result.shouldEat ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Great Choice!
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Consider Alternatives
                        </>
                      )}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>
                </div>

                {/* Listen button */}
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={speaking}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: speaking ? "#E0E0E0" : "white",
                    color: speaking ? "#9E9E9E" : "#4CAF50",
                    boxShadow: speaking ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
                    cursor: speaking ? "not-allowed" : "pointer",
                  }}
                >
                  {speaking ? (
                    <>
                      <svg className="animate-pulse w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.999 3a1 1 0 00-1 1v16a1 1 0 002 0V4a1 1 0 00-1-1zM7.999 7a1 1 0 00-1 1v8a1 1 0 002 0V8a1 1 0 00-1-1zM3.999 10a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zM15.999 7a1 1 0 00-1 1v8a1 1 0 002 0V8a1 1 0 00-1-1zM19.999 10a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1z" />
                      </svg>
                      Playing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l4.74-3.16A.75.75 0 0112.5 6.3v11.4a.75.75 0 01-1.26.56L6.5 15.2H4.75A1.75 1.75 0 013 13.45v-2.9c0-.966.784-1.75 1.75-1.75H6.5z" />
                      </svg>
                      Listen to Advice
                    </>
                  )}
                </button>
              </div>

              {/* Encouraging microcopy at the bottom */}
              <div className="text-center py-2 animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
                <p className="text-sm text-gray-400 font-medium">
                  {result.shouldEat ? "You\u2019re on fire! Keep logging meals." : "Every meal is a learning moment!"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
