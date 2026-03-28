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
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-[#1A1A1A]">
            Text to Image
          </h1>
          <p className="text-[#6B6B6B] text-base mt-2">
            Describe what you want to see
          </p>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-[#E8E8E6] bg-white p-1.5 mb-8 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="A golden retriever sitting in a field of wildflowers..."
              className="flex-1 bg-transparent px-5 py-3.5 text-[#1A1A1A] placeholder-[#9CA3A0] focus:outline-none text-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="rounded-lg bg-[#1A1A1A] text-white px-6 py-3.5 font-medium text-sm hover:bg-[#333333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-[#E8E8E6] shadow-lg">
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full"
            />
            <div className="bg-[#F5F5F3] px-5 py-3 border-t border-[#E8E8E6]">
              <p className="text-xs text-[#6B6B6B] truncate">{prompt}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!imageUrl && !loading && !error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D4D4D2] py-24">
            <svg className="w-12 h-12 mb-3 text-[#C4C4C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm text-[#9CA3A0]">Your image will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
