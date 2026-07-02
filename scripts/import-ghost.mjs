#!/usr/bin/env node

import fs from "node:fs/promises";

import {
  cleanText,
  extractGhostData,
  htmlToMdx,
  normalizeDate,
  parseFlags,
  processCoverImage,
  slugify,
  siteUrl,
  writeMdx,
} from "./import-utils.mjs";

const { flags, positional } = parseFlags(process.argv.slice(2));
const exportPath = positional[0];

if (!exportPath) {
  console.error(
    "Usage: npm run import:ghost -- /path/to/ghost-export.json [--download-images] [--include-non-public]"
  );
  process.exit(1);
}

const raw = JSON.parse(await fs.readFile(exportPath, "utf8"));
const data = extractGhostData(raw);

const tagsById = new Map((data.tags ?? []).map((tag) => [tag.id, tag]));
const postTags = new Map();

for (const join of data.posts_tags ?? []) {
  if (!postTags.has(join.post_id)) postTags.set(join.post_id, []);
  const tag = tagsById.get(join.tag_id);
  if (tag) postTags.get(join.post_id).push(tag);
}

async function importEntry(kind, item) {
  if (item.status && item.status !== "published") return { skipped: true };
  if (!flags.includeNonPublic && item.visibility && item.visibility !== "public") {
    return { skipped: true, reason: "non-public" };
  }

  const slug = slugify(item.slug || item.title);
  const tags = kind === "post" ? postTags.get(item.id) ?? [] : [];
  const publishedAt = normalizeDate(item.published_at || item.created_at);
  const metadata = await processCoverImage(
    {
      title: cleanText(item.title),
      description: cleanText(item.custom_excerpt || item.excerpt || item.meta_description),
      publishedAt,
      updatedAt: normalizeDate(item.updated_at),
      coverImage: item.feature_image || undefined,
      legacyUrl: `${siteUrl}/${slug}/`,
      tags: tags.map((tag) => tag.name),
      tagSlugs: tags.map((tag) => tag.slug || slugify(tag.name)),
    },
    flags
  );

  const html = item.html || item.plaintext || "";
  const markdown = await htmlToMdx(html, metadata, flags);
  const result = await writeMdx(kind, slug, metadata, markdown, flags);
  return { ...result, slug };
}

let postCount = 0;
let pageCount = 0;
let skippedNonPublic = 0;

for (const post of data.posts ?? []) {
  const kind = post.type === "page" ? "page" : "post";
  const result = await importEntry(kind, post);
  if (result.reason === "non-public") skippedNonPublic += 1;
  if (!result.skipped && kind === "post") postCount += 1;
  if (!result.skipped && kind === "page") pageCount += 1;
}

for (const page of data.pages ?? []) {
  const result = await importEntry("page", page);
  if (result.reason === "non-public") skippedNonPublic += 1;
  if (!result.skipped) pageCount += 1;
}

console.log(`Imported ${postCount} posts and ${pageCount} pages from Ghost export.`);
if (skippedNonPublic) {
  console.log(
    `Skipped ${skippedNonPublic} non-public entries. Re-run with --include-non-public to publish them statically.`
  );
}
