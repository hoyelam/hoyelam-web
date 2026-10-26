import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

const article = new URL(
  "../src/content/posts/thoughts-lol-worlds-draw-2020.mdx",
  import.meta.url,
);
const images = ["image-b6bfd09145", "image-1-2f671426e0"];

for (const name of images) {
  test(`Worlds draw image ${name} is smaller and lossless`, async () => {
    const imagePath = `/images/imported/2020/09/${name}`;
    const original = new URL(`../public${imagePath}.png`, import.meta.url);
    const optimized = new URL(`../public${imagePath}.webp`, import.meta.url);
    const source = readFileSync(article, "utf8");

    assert.ok(source.includes(`](${imagePath}.webp)`));
    assert.ok(!source.includes(`](${imagePath}.png)`));
    // Retain the original URL and save at least 25% without changing pixels.
    assert.ok(statSync(optimized).size < statSync(original).size * 0.75);

    const before = await sharp(readFileSync(original))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const after = await sharp(readFileSync(optimized))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    assert.equal(after.info.width, before.info.width);
    assert.equal(after.info.height, before.info.height);
    assert.equal(after.info.channels, before.info.channels);
    assert.ok(after.data.equals(before.data), "Decoded pixels must not change");
  });
}
