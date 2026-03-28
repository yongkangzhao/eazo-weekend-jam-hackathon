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
];
