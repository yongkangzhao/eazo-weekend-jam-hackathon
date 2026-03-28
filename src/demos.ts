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
    slug: "example-text-to-image",
    title: "Text to Image",
    description: "Generate images from text prompts using MiniMax's image generation API.",
    apis: ["text-to-image"],
    author: "team",
    status: "wip",
  },
  {
    slug: "memory-stream",
    title: "Memory Stream",
    description:
      "Reconstruct a flowing memory narrative from a LinkedIn profile — with AI-generated visuals and soundscapes.",
    apis: ["chat-completion", "text-to-image", "text-to-speech"],
    author: "@zefang-liu",
    status: "wip",
  },
  {
    slug: "nutrition-assistant",
    title: "AI Nutrition Assistant",
    description:
      "Snap a photo of your food and get instant calorie estimates, macro breakdowns, and personalized dietary recommendations.",
    apis: ["chat-completion", "text-to-speech"],
    author: "@zefang-liu",
    status: "wip",
  },
  {
    slug: "commute-mood",
    title: "CommuteMood",
    description:
      "Join your train. Feel the vibe. An ephemeral mood-sharing experience for transit riders.",
    apis: ["text-to-image"],
    author: "@SelenaChi",
    status: "wip",
  },
  {
    slug: "dual-shot",
    title: "DualShot",
    description:
      "Record from both cameras at once — back for content, front for your face — then generate a title and description with AI.",
    apis: ["chat-completion"],
    author: "@yongkangzhao",
    status: "wip",
  },
];
