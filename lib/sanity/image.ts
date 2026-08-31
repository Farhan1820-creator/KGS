import createImageUrlBuilder from "@sanity/image-url";
import { projectId, dataset } from "./client";

const imageBuilder = projectId
  ? createImageUrlBuilder({
      projectId,
      dataset,
    })
  : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlForImage(source: any): string | null {
  if (!imageBuilder || !source) return null;
  try {
    return imageBuilder.image(source).auto("format").fit("max").url();
  } catch {
    return null;
  }
}
