import { getLocalImageDimensions } from "./image-dimensions.mjs";

async function visitImages(node, callback, ancestors = []) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && node.tagName === "img") {
    await callback(node, ancestors);
  }
  for (const child of node.children ?? []) {
    await visitImages(child, callback, [...ancestors, node]);
  }
}
function nodeText(node) {
  if (node?.type === "text") return node.value ?? "";
  return (node?.children ?? []).map(nodeText).join("");
}

function adjacentCaption(ancestors) {
  const paragraphIndex = ancestors.findLastIndex(
    (node) => node?.type === "element" && node.tagName === "p",
  );
  if (paragraphIndex <= 0) return undefined;

  const paragraph = ancestors[paragraphIndex];
  const parent = ancestors[paragraphIndex - 1];
  const paragraphPosition = parent.children?.indexOf(paragraph) ?? -1;
  const caption = parent.children
    ?.slice(paragraphPosition + 1)
    .find((child) => child.type !== "text" || child.value.trim());
  const meaningfulChildren = caption?.children?.filter(
    (child) => child.type !== "text" || child.value.trim(),
  );

  if (
    caption?.type !== "element" ||
    caption.tagName !== "p" ||
    meaningfulChildren?.length !== 1 ||
    meaningfulChildren[0].type !== "element" ||
    meaningfulChildren[0].tagName !== "em"
  ) {
    return undefined;
  }

  return nodeText(meaningfulChildren[0]).trim() || undefined;
}

export default function rehypeImageAttributes() {
  return async (tree) => {
    let imageIndex = 0;

    await visitImages(tree, async (image, ancestors) => {
      image.properties ??= {};
      image.properties.decoding ??= "async";
      if (imageIndex > 0) image.properties.loading ??= "lazy";
      imageIndex += 1;

      if (!image.properties.alt) {
        image.properties.alt = adjacentCaption(ancestors) ?? "";
      }

      const dimensions = getLocalImageDimensions(image.properties.src);
      if (dimensions?.width && dimensions?.height) {
        image.properties.width ??= dimensions.width;
        image.properties.height ??= dimensions.height;
      }
    });
  };
}
