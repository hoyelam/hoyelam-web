import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));

function visitImages(node, callback) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && node.tagName === "img") callback(node);
  node.children?.forEach((child) => visitImages(child, callback));
}

function localImageDimensions(src) {
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

    return imageSize(readFileSync(imagePath));
  } catch {
    return undefined;
  }
}

export default function rehypeImageAttributes() {
  return (tree) => {
    let imageIndex = 0;

    visitImages(tree, (image) => {
      image.properties ??= {};
      image.properties.decoding ??= "async";
      if (imageIndex > 0) image.properties.loading ??= "lazy";

      const dimensions = localImageDimensions(image.properties.src);
      if (dimensions?.width && dimensions?.height) {
        image.properties.width ??= dimensions.width;
        image.properties.height ??= dimensions.height;
      }

      imageIndex += 1;
    });
  };
}
