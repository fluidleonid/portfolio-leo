import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "../env";

const builder = createImageUrlBuilder({ projectId, dataset });

// Safe helper for resolving both direct URL strings and uploaded Sanity image assets
export const urlForImage = (source: unknown): string => {
  if (!source) return "";
  if (typeof source === "string") return source;
  try {
    const directUrl =
      (source as { url?: string })?.url ||
      (source as { asset?: { url?: string } })?.asset?.url;
    if (directUrl) return directUrl;

    return builder.image(source as any).url() || "";
  } catch {
    return "";
  }
};
