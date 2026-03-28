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
    <div className="max-w-2xl mx-auto">
      <a
        href="/"
        className="text-sm text-gray-400 hover:text-gray-200 mb-6 inline-block"
      >
        &larr; Back to Gallery
      </a>
      <h1 className="text-2xl font-bold mb-2">Text to Image</h1>
      <p className="text-gray-400 mb-6">
        Enter a text prompt and generate an image using MiniMax.
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="A futuristic city at sunset..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-900/30 border border-red-800 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="mt-6">
          <img
            src={imageUrl}
            alt={prompt}
            className="rounded-lg border border-gray-800 w-full"
          />
        </div>
      )}

      {!imageUrl && !loading && !error && (
        <div className="mt-10 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-700 py-20 text-gray-500">
          Your generated image will appear here
        </div>
      )}
    </div>
  );
}
