"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

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

const WAVEFORM_HEIGHTS = [10, 22, 14, 30, 18, 34, 16, 26, 12, 32, 20, 28, 14, 24, 18, 30, 12, 22, 16, 26];
const RAINBOW = ["#f472b6","#fb923c","#facc15","#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c","#facc15","#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c","#facc15","#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c"];

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
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
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
      const scriptRes = await fetch("/api/audio-flow/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputMode === "text" ? { text: content } : { url: content }),
      });
      if (!scriptRes.ok) { const d = await scriptRes.json(); throw new Error(d.error ?? "Script generation failed"); }
      const { title, script, wordCount } = await scriptRes.json();

      setStep("audio");
      const audioRes = await fetch("/api/audio-flow/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      if (!audioRes.ok) { const d = await audioRes.json(); throw new Error(d.error ?? "Audio generation failed"); }
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #fff7ed 45%, #eff6ff 100%)" }}>

      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #e879f9 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 left-1/3 w-72 h-72 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-500 hover:text-fuchsia-700 transition-colors mb-10">
          ← Gallery
        </Link>

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 shadow-xl shadow-fuchsia-200"
            style={{ background: "linear-gradient(135deg, #d946ef, #f97316)" }}>
            <span className="text-4xl">🎙</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3"
            style={{ background: "linear-gradient(135deg, #d946ef 0%, #f97316 60%, #facc15 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            AudioFlow
          </h1>
          <p className="text-gray-500 text-lg">
            Drop any article. Get a bingeable podcast. <span className="font-semibold text-fuchsia-500">In 30 seconds.</span>
          </p>
        </div>

        {/* ── IDLE / ERROR: Input ── */}
        {(step === "idle" || step === "error") && (
          <div className="bg-white rounded-3xl shadow-2xl shadow-fuchsia-100 overflow-hidden border border-fuchsia-100">

            {/* Pill tabs */}
            <div className="p-4 pb-0">
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                {(["text", "url"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      inputMode === mode
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {mode === "text" ? "📄 Paste Article" : "🔗 Enter URL"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {inputMode === "text" ? (
                <textarea
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  placeholder="Paste anything — a blog post, a research paper, a news article, a spicy Twitter thread…"
                  rows={7}
                  className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-300 focus:border-fuchsia-300 focus:bg-white focus:outline-none resize-none text-sm leading-relaxed transition-all"
                />
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://example.com/that-article-you-never-had-time-to-read"
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-300 focus:border-fuchsia-300 focus:bg-white focus:outline-none text-sm transition-all"
                  />
                  <p className="text-xs text-gray-400 pl-1">Works with any publicly accessible article or blog post.</p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-500 text-sm font-medium">
                  😬 {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!hasContent}
                className="w-full rounded-2xl py-4 font-bold text-white text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: hasContent
                    ? "linear-gradient(135deg, #d946ef 0%, #f97316 100%)"
                    : "#e5e7eb",
                  boxShadow: hasContent ? "0 8px 30px -4px rgba(217,70,239,0.4)" : "none",
                }}
              >
                🎧 Generate My Podcast Episode
              </button>

              <p className="text-center text-xs text-gray-400">
                ✨ ~30 seconds · Hosted by Alex · Powered by MiniMax
              </p>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {(step === "script" || step === "audio") && (
          <div className="bg-white rounded-3xl shadow-2xl shadow-fuchsia-100 p-8 border border-fuchsia-100">
            {/* Rainbow waveform */}
            <div className="flex justify-center items-end gap-1 h-14 mb-6">
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full animate-bounce"
                  style={{
                    height: `${h}px`,
                    background: RAINBOW[i],
                    animationDelay: `${(i * 55) % 450}ms`,
                    opacity: 0.7 + (h / 34) * 0.3,
                  }}
                />
              ))}
            </div>

            <p className="text-center text-xl font-bold text-gray-800 mb-2">
              {step === "script" ? "✍️ Writing your episode…" : "🎤 Recording the audio…"}
            </p>
            <p className="text-center text-sm text-gray-400 mb-8">
              {step === "script" ? "Turning your article into a bingeable script" : "Alex is warming up the mic"}
            </p>

            <div className="space-y-3 max-w-xs mx-auto">
              {[
                { label: "Read the article", emoji: "📖", done: true },
                { label: "Write the script", emoji: "✍️", done: step === "audio", active: step === "script" },
                { label: "Record with AI voice", emoji: "🎤", done: false, active: step === "audio" },
              ].map(({ label, emoji, done, active }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all font-bold ${
                    done ? "text-white" : active ? "border-2 animate-pulse" : "border-2 border-gray-200 bg-gray-50 text-gray-300"
                  }`}
                    style={done ? { background: "linear-gradient(135deg, #d946ef, #f97316)" } : active ? { borderColor: "#d946ef", background: "#fdf4ff", color: "#d946ef" } : {}}
                  >
                    {done ? "✓" : emoji}
                  </div>
                  <span className={`text-sm font-medium ${done ? "text-gray-400 line-through" : active ? "text-gray-800" : "text-gray-300"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE: Player ── */}
        {step === "done" && result && (
          <div className="space-y-3">
            {/* Player card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-fuchsia-100 overflow-hidden border border-fuchsia-100">

              {/* Colorful header stripe */}
              <div className="h-2" style={{ background: "linear-gradient(90deg, #d946ef, #f97316, #facc15, #34d399, #60a5fa, #a78bfa)" }} />

              {/* Episode info */}
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg shadow-fuchsia-100"
                    style={{ background: "linear-gradient(135deg, #fdf4ff, #fff7ed)" }}>
                    🎙
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#d946ef" }}>
                      AudioFlow · AI Episode
                    </p>
                    <h2 className="text-lg font-black text-gray-900 leading-snug mb-2">{result.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      {[`🎧 Alex`, `⏱ ~${estimatedMinutes} min`, `📝 ${result.wordCount} words`].map((tag) => (
                        <span key={tag} className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 pb-6">
                {/* Progress bar */}
                <div className="group w-full h-3 bg-gray-100 rounded-full cursor-pointer mb-1.5 relative overflow-hidden"
                  onClick={handleSeek}>
                  <div className="h-full rounded-full transition-[width] duration-100"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #d946ef, #f97316)" }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-4 tabular-nums font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl text-white flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-fuchsia-200"
                    style={{ background: "linear-gradient(135deg, #d946ef, #f97316)" }}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  {/* Rainbow waveform */}
                  <div className="flex gap-0.5 items-center h-10 flex-1">
                    {WAVEFORM_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? "animate-bounce" : ""}`}
                        style={{
                          height: `${isPlaying ? h : 3}px`,
                          background: RAINBOW[i],
                          opacity: isPlaying ? 0.8 : 0.25,
                          animationDelay: `${(i * 55) % 450}ms`,
                          maxWidth: "4px",
                        }}
                      />
                    ))}
                  </div>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-fuchsia-500 transition-colors px-3 py-2 rounded-xl border-2 border-gray-100 hover:border-fuchsia-200 flex-shrink-0"
                  >
                    ↓ MP3
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 px-5 py-3.5 text-sm font-semibold text-gray-400 hover:border-fuchsia-300 hover:text-fuchsia-500 transition-all flex items-center justify-between"
            >
              <span>📜 Read the transcript</span>
              <span className="text-xs">{showTranscript ? "▲" : "▼"}</span>
            </button>

            {showTranscript && (
              <div className="rounded-2xl border-2 border-dashed border-fuchsia-100 bg-white/80 p-5 max-h-72 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{result.script}</p>
              </div>
            )}

            {/* Reset */}
            <button onClick={resetDemo} className="w-full text-sm font-semibold text-gray-400 hover:text-fuchsia-500 transition-colors py-2">
              🔄 Make another episode
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
