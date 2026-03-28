import { NextRequest, NextResponse } from "next/server";

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";

function getHeaders() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function buildUrl(path: string): string {
  const groupId = process.env.MINIMAX_GROUP_ID;
  return groupId
    ? `${MINIMAX_BASE_URL}${path}?GroupId=${groupId}`
    : `${MINIMAX_BASE_URL}${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();

    if (!script?.trim()) {
      return NextResponse.json({ error: "No script provided" }, { status: 400 });
    }

    const res = await fetch(buildUrl("/t2a_v2"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: "speech-02-hd",
        text: script,
        stream: false,
        voice_setting: {
          voice_id: "English_expressive_narrator",
          speed: 1.05,
          vol: 1.0,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 64000,
          format: "mp3",
          channel: 1,
        },
        output_format: "hex",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax TTS error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const hexAudio = data.data?.audio;
    if (!hexAudio) throw new Error("No audio data in response");

    const audioBase64 = Buffer.from(hexAudio, "hex").toString("base64");

    return NextResponse.json({ audioBase64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[AudioFlow/audio]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
