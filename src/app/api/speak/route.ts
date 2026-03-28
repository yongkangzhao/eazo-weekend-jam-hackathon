import { NextResponse } from "next/server";
import { textToSpeech } from "@/lib/minimax";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const response = await textToSpeech(text);

    // The MiniMax TTS API may return audio in different formats.
    // Handle both base64 audio data and URL-based responses.
    if (response?.audio_file) {
      // Base64 audio data
      return NextResponse.json({ audio: response.audio_file });
    }

    if (response?.extra_info?.audio_file) {
      return NextResponse.json({ audio: response.extra_info.audio_file });
    }

    if (response?.base_resp?.status_code === 0 && response?.data?.audio) {
      return NextResponse.json({ audio: response.data.audio });
    }

    // Return the full response for the client to handle
    return NextResponse.json(response);
  } catch (error) {
    console.error("TTS error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate speech";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
