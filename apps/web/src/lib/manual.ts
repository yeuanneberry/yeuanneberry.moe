import { getCollection } from "astro:content";

export const groups = ["Desktop", "Setup", "Reference"] as const;

export async function getChapters() {
  return (await getCollection("manual")).sort((a, b) => a.data.order - b.data.order);
}

export function searchText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`#*|~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
