function visitImages(node, callback) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && node.tagName === "img") callback(node);
  node.children?.forEach((child) => visitImages(child, callback));
}

export default function rehypeImageAttributes() {
  return (tree) => {
    let imageIndex = 0;

    visitImages(tree, (image) => {
      image.properties ??= {};
      image.properties.decoding ??= "async";
      if (imageIndex > 0) image.properties.loading ??= "lazy";
      imageIndex += 1;
    });
  };
}
