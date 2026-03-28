export interface Demo {
  slug: string;
  title: string;
  description: string;
  apis: string[];
  author: string;
  status: "live" | "wip" | "idea";
}

/**
 * Registry of all demos. The scaffold script appends new entries here.
 * Each slug corresponds to a route at /demos/[slug].
 */
export const demos: Demo[] = [
  {
    slug: "audio-flow",
    title: "AudioFlow",
    description: "Turn any article into a polished AI-voiced podcast episode. Paste text or a URL — get listenable audio in seconds, perfect for your commute.",
    apis: ["chat-completion", "text-to-speech"],
    author: "lifangshi",
    status: "live",
  },
  {
    slug: "example-text-to-image",
    title: "Text to Image",
    description: "Generate images from text prompts using MiniMax's image generation API.",
    apis: ["text-to-image"],
    author: "team",
    status: "wip",
  },
];
