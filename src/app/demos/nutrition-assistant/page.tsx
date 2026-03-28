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

// ─── Health goal options ─────────────────────────────────────────────────────

const HEALTH_GOALS: { value: HealthGoal; label: string; icon: string }[] = [
  { value: "weight-loss", label: "Weight Loss", icon: "🔥" },
  { value: "muscle-gain", label: "Muscle Gain", icon: "💪" },
  { value: "maintenance", label: "Maintenance", icon: "⚖️" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NutritionAssistantPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [healthGoal, setHealthGoal] = useState<HealthGoal>("maintenance");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    try {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Compress and get base64
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

      // Try to play audio from the response
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
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(result.recommendation);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      // Fallback to browser TTS
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const totalMacroGrams = result
    ? result.macros.protein + result.macros.carbs + result.macros.fat
    : 0;

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-gray-100 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-0 w-[400px] h-[400px] bg-teal-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by MiniMax
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Nutrition Assistant
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            Snap a photo of your food for instant calorie and nutrition analysis
          </p>
        </div>

        {/* Image upload area */}
        {!imagePreview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-700 hover:border-green-500/50 bg-gray-900/50 hover:bg-gray-900 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer mb-6"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Take a photo or upload an image</p>
              <p className="text-xs text-gray-500 mt-1">Tap to open camera or choose file</p>
            </div>
          </button>
        ) : (
          <div className="relative mb-6">
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Food preview"
                className="w-full object-cover max-h-80"
              />
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-900/80 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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

        {/* Health goal selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Your Health Goal
          </label>
          <div className="flex gap-2">
            {HEALTH_GOALS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setHealthGoal(goal.value)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  healthGoal === goal.value
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700"
                }`}
              >
                <span className="block text-lg mb-0.5">{goal.icon}</span>
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!imageBase64 || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-500 hover:bg-green-400 text-gray-950 mb-6"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Analyze Food"
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 rounded-xl bg-gray-900" />
            <div className="h-32 rounded-xl bg-gray-900" />
            <div className="h-20 rounded-xl bg-gray-900" />
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Foods detected */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Foods Detected
              </h2>
              <ul className="space-y-2">
                {result.foods.map((food, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm text-gray-200">{food.name}</span>
                      <span className="text-xs text-gray-500">
                        {Math.round(food.confidence * 100)}%
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {food.calories} cal
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-sm font-bold text-green-400">
                  {result.totalCalories} cal
                </span>
              </div>
            </div>

            {/* Macro breakdown */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Macro Breakdown
              </h2>
              <div className="space-y-3">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-medium">Protein</span>
                    <span className="text-gray-400">
                      {result.macros.protein}g
                      {totalMacroGrams > 0 &&
                        ` (${Math.round((result.macros.protein / totalMacroGrams) * 100)}%)`}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-700"
                      style={{
                        width: totalMacroGrams > 0
                          ? `${(result.macros.protein / totalMacroGrams) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-400 font-medium">Carbs</span>
                    <span className="text-gray-400">
                      {result.macros.carbs}g
                      {totalMacroGrams > 0 &&
                        ` (${Math.round((result.macros.carbs / totalMacroGrams) * 100)}%)`}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-yellow-500 transition-all duration-700"
                      style={{
                        width: totalMacroGrams > 0
                          ? `${(result.macros.carbs / totalMacroGrams) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                {/* Fat */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400 font-medium">Fat</span>
                    <span className="text-gray-400">
                      {result.macros.fat}g
                      {totalMacroGrams > 0 &&
                        ` (${Math.round((result.macros.fat / totalMacroGrams) * 100)}%)`}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-700"
                      style={{
                        width: totalMacroGrams > 0
                          ? `${(result.macros.fat / totalMacroGrams) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div
              className={`rounded-xl border p-4 ${
                result.shouldEat
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    result.shouldEat
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {result.shouldEat ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Good Choice
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Consider Alternatives
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {result.recommendation}
              </p>

              {/* Listen button */}
              <button
                type="button"
                onClick={handleSpeak}
                disabled={speaking}
                className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  speaking
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                }`}
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
          </div>
        )}
      </div>
    </div>
  );
}
