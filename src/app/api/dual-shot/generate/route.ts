import { chatCompletion } from "@/lib/minimax";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a creative social media content strategist. Generate a title and description optimized for the specified platform.

Platform guidelines:
- Instagram: Use attention-grabbing title, description with relevant hashtags, emoji-friendly
- TikTok: Trendy, catchy, use trending language and hooks, keep it short
- YouTube: SEO-optimized title, detailed description with keywords, call to action
- RedNote (小红书): Write in Chinese, use 小红书 style with emojis and tags, conversational tone
- X (Twitter): Punchy, concise, under 280 chars total, no hashtag spam
- LinkedIn: Professional tone, thought-leadership angle, business-relevant

If the user provides feedback for regeneration, incorporate their comment into the new version.

Return ONLY valid JSON: {"title": "...", "description": "..."}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, tags, platform, comment } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Missing description" },
        { status: 400 }
      );
    }

    const tagList = Array.isArray(tags) ? tags.join(", ") : "";
    const platformLabel = platform || "instagram";

    let userMessage = `Video description: ${description}\nPlatform: ${platformLabel}`;
    if (tagList) {
      userMessage += `\nTags: ${tagList}`;
    }
    if (comment) {
      userMessage += `\nAdditional feedback: ${comment}`;
    }

    const result = await chatCompletion([
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
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
