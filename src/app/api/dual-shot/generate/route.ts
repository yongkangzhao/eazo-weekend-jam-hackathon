import { chatCompletion } from "@/lib/minimax";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, tags } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Missing description" },
        { status: 400 }
      );
    }

    const tagList = Array.isArray(tags) ? tags.join(", ") : "";

    const result = await chatCompletion([
      {
        role: "system",
        content:
          "You are a creative social media content strategist. Given a video description and optional tags, generate a catchy title and an engaging description for the video. Respond with valid JSON only, no markdown fences. Format: {\"title\": \"...\", \"description\": \"...\"}",
      },
      {
        role: "user",
        content: `Video description: ${description}\n${tagList ? `Tags: ${tagList}` : ""}`,
      },
    ]);

    const raw = result?.choices?.[0]?.message?.content ?? "";
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: { title: string; description: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
    });
  } catch (error) {
    console.error("DualShot generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate title and description" },
      { status: 500 }
    );
  }
}
