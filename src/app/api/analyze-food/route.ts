import { NextResponse } from "next/server";
import { chatCompletionWithVision } from "@/lib/minimax";

export async function POST(request: Request) {
  try {
    const { image, healthGoal } = await request.json();

    if (!image || !healthGoal) {
      return NextResponse.json(
        { error: "Missing image or healthGoal" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert nutritionist and food analyst. Analyze the food in the provided image and return a JSON response. Be specific about food items, realistic about calorie estimates, and give actionable advice.

You MUST respond with valid JSON only, no markdown fences, no extra text. Use this exact structure:
{
  "foods": [
    { "name": "Food item name", "calories": 250, "confidence": 0.9 }
  ],
  "totalCalories": 500,
  "macros": {
    "protein": 25,
    "carbs": 60,
    "fat": 15
  },
  "recommendation": "A 2-3 sentence personalized recommendation based on the health goal.",
  "shouldEat": true
}

Rules:
- "macros" values are in grams
- "confidence" is between 0 and 1
- "shouldEat" is a boolean: true if this food aligns with the health goal, false if not
- "recommendation" should reference the specific health goal: "${healthGoal}"
- Be realistic with calorie and macro estimates based on typical serving sizes visible in the image`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${image}` },
          },
          {
            type: "text",
            text: `Analyze this food image. My health goal is: ${healthGoal}. Provide calorie estimates, macro breakdown, and a personalized recommendation. Respond with JSON only.`,
          },
        ],
      },
    ];

    const response = await chatCompletionWithVision(messages);

    // Extract the text content from the response
    const content =
      response?.choices?.[0]?.message?.content ||
      response?.reply ||
      response?.choices?.[0]?.text;

    if (!content) {
      throw new Error("No content in API response");
    }

    // Parse the JSON from the response, stripping any markdown fences
    const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Food analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze food";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
