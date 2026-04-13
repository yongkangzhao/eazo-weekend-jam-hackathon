import { textToImage } from "@/lib/minimax";
import { getServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const MOOD_PROMPTS: Record<string, string> = {
  "Dead Tired":
    "A quiet early morning commute scene, soft foggy cityscape through train windows, muted pastel colors, people resting with eyes closed on a gentle train ride, peaceful sleepy atmosphere, warm soft lighting, watercolor illustration style",
  "Just Woke Up":
    "A bright morning commute scene, golden sunrise light streaming through train windows, people holding coffee cups, warm amber tones, cozy and hopeful atmosphere, soft morning haze, gentle watercolor illustration style",
  Stressed:
    "A tense urban commute scene, crowded train platform, people checking watches anxiously, warm red and muted tones, busy city visible through windows, slightly chaotic energy but still human, watercolor illustration style",
  Chill:
    "A relaxed afternoon train ride, passengers reading books and gazing out windows at rolling green hills, soft natural light, calm earthy tones, gentle breeze feeling, serene and unhurried atmosphere, watercolor illustration style",
  "In the Zone":
    "A focused commute scene, person wearing headphones deeply concentrated on a laptop, blurred city lights outside train window, cool blue and violet accents, productive creative energy, soft ambient lighting, watercolor illustration style",
  "Good Day":
    "A joyful morning commute scene, smiling passengers on a sunlit train, vibrant warm orange and yellow tones, city bathed in golden light, flowers visible on platforms, uplifting cheerful energy, watercolor illustration style",
};

export async function POST(request: NextRequest) {
  try {
    const { mood, distribution } = await request.json();

    if (!mood || !distribution) {
      return NextResponse.json(
        { error: "Missing mood or distribution" },
        { status: 400 }
      );
    }

    // Pick the dominant mood as the image theme
    const dominantMood = Object.entries(distribution as Record<string, number>)
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    const moodKey = MOOD_PROMPTS[dominantMood] ? dominantMood : mood;

    // ── Cache check ──────────────────────────────────────────────────
    const supabase = getServiceClient();
    const { data: cached } = await supabase
      .from("vibe_image_cache")
      .select("image_url")
      .eq("mood", moodKey)
      .single();

    if (cached?.image_url) {
      return NextResponse.json({ imageUrl: cached.image_url, cached: true });
    }

    // ── Generate (slow path, first time only per mood) ───────────────
    const prompt =
      MOOD_PROMPTS[moodKey] ??
      "A peaceful morning commute on a city train, warm tones, watercolor illustration style";

    const result = await textToImage(prompt);
    const imageUrl = result?.data?.image_urls?.[0];

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Store in cache (best-effort, don't fail the request if it errors)
    await supabase
      .from("vibe_image_cache")
      .upsert({ mood: moodKey, image_url: imageUrl })
      .then(({ error }) => {
        if (error) console.warn("[vibe-image] cache write failed:", error.message);
      });

    return NextResponse.json({ imageUrl, cached: false });
  } catch (error) {
    console.error("Vibe image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate vibe image" },
      { status: 500 }
    );
  }
}
