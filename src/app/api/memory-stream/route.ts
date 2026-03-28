import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/minimax";

const SYSTEM_PROMPT = `You are a creative biographer AI. Given a LinkedIn profile (pasted text), you reconstruct a person's life as a series of 5-7 memorable life phases — from childhood through their current role.

For each phase, generate:
- yearRange: approximate years (e.g. "1990-1998")
- title: a short evocative title (e.g. "Small-Town Beginnings")
- description: 2-3 sentences of vivid, narrative prose describing this phase. Write in third person. Be imaginative but grounded in the profile facts.
- imagePrompt: a detailed prompt for an AI image generator to create a cinematic, dreamlike image representing this phase. Include visual style cues like "cinematic lighting, warm tones, film grain, 35mm photography style". Never include real names or faces.
- audioMood: a short mood description for background music (e.g. "gentle piano, nostalgic", "upbeat electronic, ambitious")

If information is sparse, use reasonable creative inference based on locations, schools, and industries mentioned.

Return ONLY valid JSON in this exact format — no markdown, no code fences, no explanation:
{
  "name": "Person's first name",
  "phases": [
    {
      "yearRange": "...",
      "title": "...",
      "description": "...",
      "imagePrompt": "...",
      "audioMood": "..."
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { profileText } = await req.json();
    if (!profileText || typeof profileText !== "string") {
      return NextResponse.json(
        { error: "profileText is required" },
        { status: 400 }
      );
    }

    if (profileText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide more profile information to generate a meaningful timeline." },
        { status: 400 }
      );
    }

    const result = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the LinkedIn profile text:\n\n${profileText}`,
      },
    ]);

    const content =
      result.choices?.[0]?.message?.content ?? result.reply ?? "";

    // Try to extract JSON from the response
    let parsed;
    try {
      // Handle potential markdown code fences
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse timeline from AI response. Please try again." },
        { status: 502 }
      );
    }

    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      return NextResponse.json(
        { error: "Invalid timeline format from AI. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Memory stream API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
