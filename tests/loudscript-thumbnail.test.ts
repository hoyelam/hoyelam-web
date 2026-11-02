import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

const imagePath = "/images/projects/loudscript-mac-main-window";
const original = new URL(`../public${imagePath}.png`, import.meta.url);
const optimized = new URL(`../public${imagePath}.webp`, import.meta.url);

test("LoudScript thumbnail saves at least 50% without changing pixels or color profile", async () => {
  const source = readFileSync(new URL("../src/data/projects.ts", import.meta.url), "utf8");
  assert.ok(source.includes(`thumbnail: "${imagePath}.webp"`));
  assert.ok(!source.includes(`thumbnail: "${imagePath}.png"`));
  // Keep the original URL available for existing links.
  assert.ok(statSync(optimized).size < statSync(original).size * 0.5);

  const beforeImage = sharp(readFileSync(original));
  const afterImage = sharp(readFileSync(optimized));
  const beforeMetadata = await beforeImage.metadata();
  const afterMetadata = await afterImage.metadata();
  assert.equal(afterMetadata.format, "webp");
  assert.ok(beforeMetadata.icc, "The screenshot has an embedded display profile");
  assert.deepEqual(afterMetadata.icc, beforeMetadata.icc);

  const before = await beforeImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const after = await afterImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(after.info.width, before.info.width);
  assert.equal(after.info.height, before.info.height);
  assert.equal(after.info.channels, before.info.channels);
  assert.ok(after.data.equals(before.data), "Decoded pixels must not change");
});
