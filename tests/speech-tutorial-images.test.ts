import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

const article = new URL(
  "../src/content/posts/how-to-let-ios-speak-to-you.mdx",
  import.meta.url,
);
const screenshots = [
  "CleanShot-2022-08-26-at-17.38.54-2x-d185c23284",
  "CleanShot-2022-08-26-at-23.06.33-2x-952c0d3e00",
];

for (const name of screenshots) {
  test(`speech tutorial screenshot ${name} is smaller and lossless`, async () => {
    const imagePath = `/images/imported/2022/08/${name}`;
    const original = new URL(`../public${imagePath}.png`, import.meta.url);
    const optimized = new URL(`../public${imagePath}.webp`, import.meta.url);
    const source = readFileSync(article, "utf8");

    assert.ok(source.includes(`](${imagePath}.webp)`));
    assert.ok(!source.includes(`](${imagePath}.png)`));
    // Keep the original URL working and retain a pixel-for-pixel reference.
    assert.ok(statSync(optimized).size < statSync(original).size * 0.6);

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
