import { NextResponse } from "next/server";
import { textToSpeech } from "@/lib/minimax";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const response = await textToSpeech(text);

    // MiniMax TTS returns hex-encoded audio in data.audio
    if (response?.base_resp?.status_code === 0 && response?.data?.audio) {
      // Convert hex string to base64 for the client
      const hexString = response.data.audio;
      const bytes = new Uint8Array(
        hexString.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
      );
      const base64 = Buffer.from(bytes).toString("base64");
      return NextResponse.json({ audio: base64 });
    }

    return NextResponse.json(
      { error: "No audio data in API response" },
      { status: 502 }
    );
  } catch (error) {
    console.error("TTS error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate speech";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
