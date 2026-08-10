import { readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

const publicRoot = path.resolve(process.cwd(), "public");

export function getLocalImageDimensions(src) {
  if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//"))
    return undefined;

  try {
    const pathname = decodeURIComponent(
      new URL(src, "https://hoyelam.com").pathname,
    );
    const imagePath = path.resolve(publicRoot, `.${pathname}`);
    const relativePath = path.relative(publicRoot, imagePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath))
      return undefined;

    const { width, height } = imageSize(readFileSync(imagePath));
    return width && height ? { width, height } : undefined;
  } catch {
    return undefined;
  }
}
