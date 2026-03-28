/**
 * MiniMax API client.
 * Docs: https://www.minimax.io/platform/docs
 */

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";

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
  const res = await fetch(`${MINIMAX_BASE_URL}/image_generation`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      model: "image-01",
      aspect_ratio: "16:9",
      n: 1,
      response_format: "url",
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}

/** Text-to-Speech generation */
export async function textToSpeech(text: string, voiceId = "English_expressive_narrator") {
  const res = await fetch(`${MINIMAX_BASE_URL}/t2a_v2`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: "speech-02-hd",
      text,
      stream: false,
      voice_setting: {
        voice_id: voiceId,
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        format: "mp3",
        channel: 1,
      },
      output_format: "hex",
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

/** Chat completion */
export async function chatCompletion(
  messages: { role: string; content: string }[]
) {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: "MiniMax-Text-01",
      messages,
    }),
  });
  if (!res.ok) throw new Error(`MiniMax API error: ${res.status}`);
  return res.json();
}

/** Chat completion with vision support */
export async function chatCompletionWithVision(
  messages: { role: string; content: unknown }[]
) {
  const res = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: "MiniMax-Text-01",
      messages,
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
