import { readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

const publicRoot = path.resolve(process.cwd(), "public");

export function getLocalImageDimensions(src) {
  if (!src.startsWith("/") || src.startsWith("//")) return undefined;

  const pathname = decodeURIComponent(new URL(src, "https://hoyelam.com").pathname);
  const { width, height } = imageSize(readFileSync(path.join(publicRoot, pathname)));
  return { width, height };
}
