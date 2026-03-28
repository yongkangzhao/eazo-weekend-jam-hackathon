"use client";

import { useState } from "react";

export default function ExampleTextToImage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0015] text-white relative overflow-hidden">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Powered by MiniMax
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              Imagine Anything
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Describe a scene and bring it to life with AI
          </p>
        </div>

        {/* Input */}
        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-sm p-1.5 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="A futuristic city floating in the clouds at golden hour..."
              className="flex-1 bg-transparent px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3.5 font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/10">
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full"
            />
            <div className="bg-white/[0.03] backdrop-blur-sm px-5 py-3 border-t border-purple-500/10">
              <p className="text-xs text-gray-500 truncate">{prompt}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!imageUrl && !loading && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-500/20 py-24 text-gray-600">
            <svg className="w-12 h-12 mb-3 text-purple-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm">Your creation will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
