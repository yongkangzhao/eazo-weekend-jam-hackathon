/**
 * MiniMax API client stub.
 * Replace base URL / headers once API keys are available.
 * Docs: https://www.minimax.io/platform/docs
 */

const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";

function getHeaders() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/** Text-to-Image generation */
export async function textToImage(prompt: string) {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/image`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      model: "image-01",
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}

/** Text-to-Speech generation */
export async function textToSpeech(text: string, voiceId = "default") {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/speech`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      model: "speech-02",
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}

/** Text-to-Video generation (Hailuo) */
export async function textToVideo(prompt: string) {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/video`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      model: "video-01",
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}

/** Music generation */
export async function textToMusic(prompt: string) {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/music`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      model: "music-01",
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}
