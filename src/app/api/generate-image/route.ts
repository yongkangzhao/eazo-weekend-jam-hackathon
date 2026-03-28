import { NextRequest, NextResponse } from "next/server";
import { textToImage } from "@/lib/minimax";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await textToImage(prompt);
    const imageUrl = result?.data?.image_urls?.[0] ?? null;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
