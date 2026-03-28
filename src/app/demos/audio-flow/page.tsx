"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Step = "idle" | "script" | "audio" | "done" | "error";

interface PodcastResult {
  title: string;
  script: string;
  wordCount: number;
  audioBase64: string;
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const WAVEFORM_HEIGHTS = [10, 20, 14, 28, 18, 32, 16, 24, 12, 30, 20, 26, 14, 22, 18, 28, 12, 20, 16, 24];

export default function AudioFlow() {
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [articleText, setArticleText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<PodcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!result?.audioBase64) return;
    const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.pause();
      audio.src = "";
    };
  }, [result]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }, [duration]);

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `data:audio/mp3;base64,${result.audioBase64}`;
    a.download = `${result.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
    a.click();
  }

  async function handleGenerate() {
    const content = inputMode === "text" ? articleText.trim() : articleUrl.trim();
    if (!content) return;

    setStep("script");
    setError(null);
    setResult(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    try {
      // Step 1: generate script
      const scriptRes = await fetch("/api/audio-flow/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputMode === "text" ? { text: content } : { url: content }),
      });
      if (!scriptRes.ok) {
        const d = await scriptRes.json();
        throw new Error(d.error ?? "Script generation failed");
      }
      const { title, script, wordCount } = await scriptRes.json();

      // Step 2: generate audio
      setStep("audio");
      const audioRes = await fetch("/api/audio-flow/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      if (!audioRes.ok) {
        const d = await audioRes.json();
        throw new Error(d.error ?? "Audio generation failed");
      }
      const { audioBase64 } = await audioRes.json();

      setResult({ title, script, wordCount, audioBase64 });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  function resetDemo() {
    setStep("idle");
    setResult(null);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowTranscript(false);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const estimatedMinutes = result ? Math.round(result.wordCount / 150) : 0;
  const hasContent = inputMode === "text" ? articleText.trim().length > 0 : articleUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-10"
        >
          ← Back to Gallery
        </a>

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-900/40">
              🎙
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AudioFlow</h1>
              <p className="text-sm text-violet-400 font-medium">Powered by MiniMax</p>
            </div>
          </div>
          <p className="text-gray-400 text-lg leading-relaxed">
            Paste any article and get a polished, AI-voiced podcast episode in seconds — perfect for your commute.
          </p>
        </div>

        {/* ── IDLE / ERROR: Input form ── */}
        {(step === "idle" || step === "error") && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              {(["text", "url"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 py-3.5 text-sm font-medium transition-all ${
                    inputMode === mode
                      ? "bg-gray-800 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-850"
                  }`}
                >
                  {mode === "text" ? "📄  Paste Article" : "🔗  Enter URL"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {inputMode === "text" ? (
                <textarea
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  placeholder="Paste your article, blog post, research paper, or any long-form text here…"
                  rows={8}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none text-sm leading-relaxed transition-colors"
                />
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none text-sm transition-colors"
                  />
                  <p className="text-xs text-gray-600 pl-1">Works best with publicly accessible articles and blog posts.</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-950/60 border border-red-800/60 px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!hasContent}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30 active:scale-[0.99]"
              >
                Generate Podcast Episode →
              </button>

              <p className="text-center text-xs text-gray-600">
                ~30 seconds · Hosted by Alex · MiniMax TTS
              </p>
            </div>
          </div>
        )}

        {/* ── LOADING: Progress steps ── */}
        {(step === "script" || step === "audio") && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
            {/* Animated waveform */}
            <div className="flex justify-center items-end gap-1 h-12 mb-6">
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-violet-500 animate-bounce"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${(i * 60) % 500}ms`,
                    opacity: 0.4 + (h / 32) * 0.6,
                  }}
                />
              ))}
            </div>

            <p className="text-center text-gray-200 font-medium mb-8">
              {step === "script" ? "Writing your episode script…" : "Recording with AI voice…"}
            </p>

            <div className="space-y-4 max-w-xs mx-auto">
              {[
                { label: "Analyzing article content", done: true },
                { label: "Writing podcast script", done: step === "audio", active: step === "script" },
                { label: "Recording AI voice narration", done: false, active: step === "audio" },
              ].map(({ label, done, active }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      done
                        ? "bg-violet-600 text-white"
                        : active
                        ? "border-2 border-violet-500 animate-pulse bg-violet-950"
                        : "border-2 border-gray-700 bg-gray-800"
                    }`}
                  >
                    {done && "✓"}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      done ? "text-gray-300 line-through decoration-gray-600" : active ? "text-gray-100" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE: Podcast Player ── */}
        {step === "done" && result && (
          <div className="space-y-3">
            {/* Player card */}
            <div className="rounded-2xl overflow-hidden border border-violet-900/40 shadow-2xl shadow-violet-950/50">

              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-violet-950 via-indigo-950 to-gray-900 px-6 py-6 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-indigo-600/10 blur-xl" />

                <div className="relative flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl flex-shrink-0 shadow-lg shadow-violet-900/60">
                    🎙
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">
                      AudioFlow · AI Podcast
                    </p>
                    <h2 className="text-lg font-bold text-white leading-snug mb-3">
                      {result.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-violet-400">🎧</span> Hosted by Alex
                      </span>
                      <span className="text-gray-700">·</span>
                      <span className="flex items-center gap-1">
                        <span className="text-violet-400">⏱</span> ~{estimatedMinutes} min
                      </span>
                      <span className="text-gray-700">·</span>
                      <span>{result.wordCount} words</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player controls */}
              <div className="bg-gray-900 px-6 py-5">
                {/* Seekbar */}
                <div
                  className="group w-full h-2 bg-gray-800 rounded-full cursor-pointer mb-2 relative"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  {/* Thumb indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-600 mb-4 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/50 active:scale-95 flex-shrink-0"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  {/* Live waveform bars */}
                  <div className="flex gap-0.5 items-center h-8 flex-1">
                    {WAVEFORM_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isPlaying ? "bg-violet-500 animate-bounce" : "bg-gray-700"
                        }`}
                        style={{
                          height: `${isPlaying ? h : 4}px`,
                          animationDelay: `${(i * 60) % 500}ms`,
                          maxWidth: "3px",
                        }}
                      />
                    ))}
                  </div>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    title="Download MP3"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors px-3 py-2 rounded-lg border border-gray-800 hover:border-gray-700 flex-shrink-0"
                  >
                    ↓ MP3
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript accordion */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-5 py-3.5 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>📝</span>
                <span>Read transcript</span>
              </span>
              <span className="text-gray-600 text-xs">{showTranscript ? "▲ hide" : "▼ show"}</span>
            </button>

            {showTranscript && (
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 max-h-72 overflow-y-auto">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {result.script}
                </p>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={resetDemo}
              className="w-full text-sm text-gray-600 hover:text-gray-400 transition-colors py-2"
            >
              ← Generate another episode
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
