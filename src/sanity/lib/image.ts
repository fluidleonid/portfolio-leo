import { createClient } from "next-sanity";
import { dataset, projectId } from "../env";

// Safe helper for image URLs
export const urlForImage = (source: unknown) => {
  if (!source) return "";
  if (typeof source === "string") return source;
  const asset = (source as { asset?: { url?: string; _ref?: string } })?.asset;
  if (asset?.url) return asset.url;
  return "";
};
