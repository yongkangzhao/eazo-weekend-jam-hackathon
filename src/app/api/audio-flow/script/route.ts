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

async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AudioFlow/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();

    if (!text && !url) {
      return NextResponse.json({ error: "Provide article text or a URL" }, { status: 400 });
    }

    let articleText: string = text;
    if (url && !text) {
      articleText = await fetchArticleText(url);
    }

    if (!articleText?.trim()) {
      return NextResponse.json({ error: "No article content found" }, { status: 400 });
    }

    const res = await fetch(buildUrl("/text/chatcompletion_v2"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [
          {
            role: "system",
            content:
              "You are an expert podcast script writer who creates engaging, conversational audio content. " +
              "Your scripts sound natural, warm, and intellectually stimulating — like a knowledgeable friend " +
              "explaining something fascinating. Write for the ear, not the eye.",
          },
          {
            role: "user",
            content:
              "Write a ~5 minute podcast episode script based on the article below. " +
              'Format: a single engaging host named "Alex" speaking directly to the listener. ' +
              "Start with a compelling hook. Cover 3-4 key insights naturally with relatable examples. " +
              "End with a memorable thought that lingers. Target ~700 words. " +
              "No stage directions, no [brackets], no asterisks — just the spoken words. " +
              "First line must be exactly: TITLE: [compelling episode title]\n\n" +
              `Article:\n${articleText.slice(0, 6000)}`,
          },
        ],
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MiniMax chat error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    const titleMatch = raw.match(/^TITLE:\s*(.+)/m);
    const title = titleMatch?.[1]?.trim() ?? "Today's Episode";
    const script = raw.replace(/^TITLE:\s*.+\n?/m, "").trim();
    const wordCount = script.split(/\s+/).length;

    return NextResponse.json({ title, script, wordCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[AudioFlow/script]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
