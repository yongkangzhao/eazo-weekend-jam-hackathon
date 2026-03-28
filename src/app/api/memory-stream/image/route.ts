import { NextRequest, NextResponse } from "next/server";
import { textToImage } from "@/lib/minimax";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const result = await textToImage(prompt);
    const imageUrl = result.image_url ?? result.url ?? null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from generation service" },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Memory stream image API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
