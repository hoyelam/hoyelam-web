#!/usr/bin/env node

import * as cheerio from "cheerio";

import {
  cleanText,
  htmlToMdx,
  normalizeDate,
  parseFlags,
  processCoverImage,
  slugFromUrl,
  slugify,
  writeMdx,
} from "./import-utils.mjs";

const { flags } = parseFlags(process.argv.slice(2));
const baseUrl = "https://hoyelam.com";

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function sitemapUrls(pathname) {
  const xml = await fetchText(`${baseUrl}/${pathname}`);
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("loc")
    .map((_, element) => $(element).text())
    .get();
}

function meta($, selector) {
  return cleanText($(selector).attr("content"));
}

async function importUrl(url, kind) {
  const html = await fetchText(url);
  const $ = cheerio.load(html, { decodeEntities: false });
  const slug = slugify(slugFromUrl(url));

  const title = cleanText($(".article-title").first().text()) || meta($, 'meta[property="og:title"]');
  const description =
    cleanText($(".article-excerpt").first().text()) ||
    meta($, 'meta[name="description"]') ||
    meta($, 'meta[property="og:description"]');
  const publishedAt = normalizeDate(meta($, 'meta[property="article:published_time"]'));
  const updatedAt = normalizeDate(meta($, 'meta[property="article:modified_time"]'));
  const tags = $('meta[property="article:tag"]')
    .map((_, element) => cleanText($(element).attr("content")))
    .get()
    .filter(Boolean);

  const rawContent = $("section.gh-content").first().html();
  if (!rawContent) {
    console.warn(`No content found for ${url}`);
    return { skipped: true };
  }

  const metadata = await processCoverImage(
    {
      title,
      description,
      publishedAt,
      updatedAt,
      coverImage: meta($, 'meta[property="og:image"]') || undefined,
      legacyUrl: url,
      tags,
      tagSlugs: tags.map(slugify),
    },
    flags
  );

  const markdown = await htmlToMdx(rawContent, metadata, flags);
  const result = await writeMdx(kind, slug, metadata, markdown, flags);
  return { ...result, slug };
}

const postUrls = await sitemapUrls("sitemap-posts.xml");
const pageUrls = (await sitemapUrls("sitemap-pages.xml")).filter((url) => {
  const slug = slugFromUrl(url);
  return slug && !["signin", "account", "signup"].includes(slug);
});

const limitedPostUrls = flags.limit ? postUrls.slice(0, flags.limit) : postUrls;

let importedPosts = 0;
let importedPages = 0;

for (const [index, url] of limitedPostUrls.entries()) {
  console.log(`[posts ${index + 1}/${limitedPostUrls.length}] ${url}`);
  const result = await importUrl(url, "post");
  if (!result.skipped) importedPosts += 1;
}

for (const [index, url] of pageUrls.entries()) {
  console.log(`[pages ${index + 1}/${pageUrls.length}] ${url}`);
  const result = await importUrl(url, "page");
  if (!result.skipped) importedPages += 1;
}

console.log(`Imported ${importedPosts} posts and ${importedPages} pages from the live Ghost site.`);
