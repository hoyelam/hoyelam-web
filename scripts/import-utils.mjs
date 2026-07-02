import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import TurndownService from "turndown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..");
export const siteUrl = "https://hoyelam.com";

const downloadedAssets = new Map();

export function parseFlags(argv) {
  const flags = {
    downloadImages: false,
    downloadExternalImages: false,
    includeNonPublic: false,
    limit: undefined,
    skipExisting: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--download-images") {
      flags.downloadImages = true;
    } else if (value === "--download-external-images") {
      flags.downloadExternalImages = true;
      flags.downloadImages = true;
    } else if (value === "--include-non-public" || value === "--include-paid") {
      flags.includeNonPublic = true;
    } else if (value === "--skip-existing") {
      flags.skipExisting = true;
    } else if (value === "--limit") {
      flags.limit = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else {
      positional.push(value);
    }
  }

  return { flags, positional };
}

export function slugFromUrl(value) {
  const url = new URL(value, siteUrl);
  return url.pathname.replace(/^\/|\/$/g, "");
}

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function yamlScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return JSON.stringify(String(value));
}

export function frontmatter(data) {
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${yamlScalar(item)}`);
      }
    } else {
      lines.push(`${key}: ${yamlScalar(value)}`);
    }
  }

  lines.push("---", "");
  return lines.join("\n");
}

function contentPath(kind, slug) {
  const collection = kind === "page" ? "pages" : "posts";
  return path.join(projectRoot, "src", "content", collection, `${slug}.mdx`);
}

export async function writeMdx(kind, slug, metadata, markdown, options = {}) {
  const file = contentPath(kind, slug);

  if (options.skipExisting) {
    try {
      await fs.access(file);
      return { skipped: true, file };
    } catch {
      // Continue writing if the file does not exist.
    }
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  const body = `${frontmatter(metadata)}${markdown.trim()}\n`;
  await fs.writeFile(file, body, "utf8");
  return { skipped: false, file };
}

export function extractGhostData(raw) {
  if (raw?.db?.[0]?.data) return raw.db[0].data;
  if (raw?.data) return raw.data;
  return raw;
}

function shouldDownloadImage(url, options) {
  if (!options.downloadImages) return false;
  const parsed = new URL(resolveGhostUrl(url), siteUrl);

  if (options.downloadExternalImages) return true;

  return (
    parsed.hostname === "storage.ghost.io" ||
    parsed.hostname === "hoyelam.com" ||
    parsed.hostname.endsWith(".ghost.io")
  );
}

function resolveGhostUrl(value) {
  if (!value) return value;

  return String(value)
    .replace(/^\/?__GHOST_URL__\//, `${siteUrl}/`)
    .replace(`${siteUrl}/__GHOST_URL__/`, `${siteUrl}/`)
    .replace(/([^:])\/__GHOST_URL__\//g, `$1/`);
}

function extensionFromContentType(contentType) {
  if (!contentType) return "";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("svg")) return ".svg";
  return "";
}

function safeAssetName(url, contentType) {
  const parsed = new URL(url, siteUrl);
  const hash = crypto.createHash("sha1").update(parsed.href).digest("hex").slice(0, 10);
  const sourceName = decodeURIComponent(path.basename(parsed.pathname)) || "image";
  const parsedExt = path.extname(sourceName).split("?")[0];
  const ext = parsedExt && parsedExt.length <= 6 ? parsedExt : extensionFromContentType(contentType);
  const base = path
    .basename(sourceName, parsedExt)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "image"}-${hash}${ext || ".bin"}`;
}

function escapeMdxExpressions(markdown) {
  let inFence = false;

  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }

      if (inFence) return line;

      return line
        .split(/(`+[^`]*`+)/g)
        .map((part) => {
          if (part.startsWith("`")) return part;
          return part.replace(/{/g, "\\{").replace(/}/g, "\\}");
        })
        .join("");
    })
    .join("\n");
}

export async function downloadImage(url, publishedAt, options) {
  if (!url || !shouldDownloadImage(url, options)) return url;
  const absolute = new URL(resolveGhostUrl(url), siteUrl).href;

  if (downloadedAssets.has(absolute)) {
    return downloadedAssets.get(absolute);
  }

  const date = publishedAt ? new Date(publishedAt) : new Date();
  const year = Number.isNaN(date.getTime()) ? "misc" : String(date.getUTCFullYear());
  const month = Number.isNaN(date.getTime())
    ? "images"
    : String(date.getUTCMonth() + 1).padStart(2, "0");
  const guessedFilename = safeAssetName(absolute, "");
  const guessedPublicPath = `/images/imported/${year}/${month}/${guessedFilename}`;
  const guessedDiskPath = path.join(projectRoot, "public", guessedPublicPath);

  try {
    await fs.access(guessedDiskPath);
    downloadedAssets.set(absolute, guessedPublicPath);
    return guessedPublicPath;
  } catch {
    // Fetch below if this asset has not been downloaded before.
  }

  const response = await fetch(absolute);
  if (!response.ok) {
    console.warn(`Could not download ${absolute}: ${response.status}`);
    return absolute;
  }

  const contentType = response.headers.get("content-type") || "";
  const finalUrl = response.url || absolute;
  const filename = safeAssetName(finalUrl, contentType);
  const publicPath = `/images/imported/${year}/${month}/${filename}`;
  const diskPath = path.join(projectRoot, "public", publicPath);

  await fs.mkdir(path.dirname(diskPath), { recursive: true });

  try {
    await fs.access(diskPath);
  } catch {
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(diskPath, buffer);
  }

  downloadedAssets.set(absolute, publicPath);
  return publicPath;
}

function normalizeLink(href) {
  if (!href) return href;

  try {
    const url = new URL(resolveGhostUrl(href), siteUrl);
    if (url.searchParams.get("ref") === "hoyelam.com") {
      url.searchParams.delete("ref");
    }

    if (url.origin === siteUrl) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.href;
  } catch {
    return href;
  }
}

export async function htmlToMdx(html, metadata, options = {}) {
  const $ = cheerio.load(html ?? "", { decodeEntities: false });

  $("script, style, noscript").remove();

  $("a[href]").each((_, element) => {
    $(element).attr("href", normalizeLink($(element).attr("href")));
  });

  $("figure.kg-bookmark-card").each((_, element) => {
    const link = $(element).find("a[href]").first();
    const href = normalizeLink(link.attr("href"));
    const title = cleanText($(element).find(".kg-bookmark-title").first().text()) || href;
    const description = cleanText($(element).find(".kg-bookmark-description").first().text());
    const replacement = description
      ? `<blockquote><p><a href="${href}">${title}</a></p><p>${description}</p></blockquote>`
      : `<p><a href="${href}">${title}</a></p>`;
    $(element).replaceWith(replacement);
  });

  $("iframe[src]").each((_, element) => {
    const src = normalizeLink($(element).attr("src"));
    $(element).replaceWith(`<p><a href="${src}">Embedded media</a></p>`);
  });

  const imageElements = $("img[src]").toArray();
  for (const element of imageElements) {
    const src = $(element).attr("src");
    const localSrc = await downloadImage(src, metadata.publishedAt, options);
    $(element).attr("src", localSrc);
    $(element).removeAttr("srcset");
    $(element).removeAttr("sizes");
    $(element).removeAttr("loading");
    $(element).removeAttr("class");
    $(element).removeAttr("style");
    $(element).removeAttr("onerror");
  }

  $("[class]").removeAttr("class");
  $("[style]").removeAttr("style");
  $("[data-kg-card-editable]").removeAttr("data-kg-card-editable");

  const turndown = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    headingStyle: "atx",
  });

  turndown.addRule("figures", {
    filter: "figure",
    replacement(content) {
      return `\n\n${content.trim()}\n\n`;
    },
  });

  turndown.addRule("figcaptions", {
    filter: "figcaption",
    replacement(content) {
      const caption = content.trim();
      return caption ? `\n\n_${caption}_\n\n` : "";
    },
  });

  const markdown = turndown
    .turndown($.root().html() ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]");

  return escapeMdxExpressions(markdown);
}

export async function processCoverImage(metadata, options) {
  if (!metadata.coverImage) return metadata;
  return {
    ...metadata,
    coverImage: await downloadImage(metadata.coverImage, metadata.publishedAt, options),
  };
}
