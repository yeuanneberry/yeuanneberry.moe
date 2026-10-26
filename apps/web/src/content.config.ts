import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const manual = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/manual" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    group: z.enum(["Desktop", "Setup", "Reference"]),
    order: z.number(),
    repository: z.literal("berry-desktop"),
    sourcePath: z.string(),
    sourceUrl: z.url(),
    sourceRevision: z.string(),
    sourcePublished: z.boolean(),
    reviewed: z.string(),
    generated: z.literal(true),
  }),
});

export const collections = { manual };
