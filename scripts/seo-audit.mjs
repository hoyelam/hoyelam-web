import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const distRoot = path.join(root, "dist");
const siteUrl = "https://hoyelam.com";
const reportLimit = 12;

const errors = [];
const warnings = [];
const opportunities = [];

const contentRoots = [
  { kind: "post", dir: path.join(root, "src/content/posts") },
  { kind: "page", dir: path.join(root, "src/content/pages") },
];

function filesIn(dir, predicate = () => true) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...filesIn(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}
function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function parseContentFile(file, kind) {
  const source = readFileSync(file, "utf8");
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = frontmatterMatch?.[1] ?? "";
  const body = frontmatterMatch
    ? source.slice(frontmatterMatch[0].length)
    : source;
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim();

  return {
    kind,
    id: path.basename(file).replace(/\.mdx?$/, ""),
    file: path.relative(root, file),
    title: frontmatterValue(frontmatter, "title"),
    description: frontmatterValue(frontmatter, "description"),
    coverImage: frontmatterValue(frontmatter, "coverImage"),
    words: text ? text.split(/\s+/).length : 0,
  };
}

function pagePathFromHtml(file) {
  const relative = path.relative(distRoot, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  return `/${relative}`;
}

function absolutePageUrl(pagePath) {
  return new URL(pagePath, siteUrl).toString();
}

function distPathExists(urlPath) {
  const pathname = decodeURIComponent(urlPath.split(/[?#]/, 1)[0]);
  const relative = pathname.replace(/^\/+/, "");

  if (!relative) return existsSync(path.join(distRoot, "index.html"));
  if (existsSync(path.join(distRoot, relative))) return true;
  if (existsSync(path.join(distRoot, relative, "index.html"))) return true;
  if (existsSync(path.join(distRoot, `${relative.replace(/\/$/, "")}.html`))) {
    return true;
  }

  return false;
}

function groupDuplicates(rows, field) {
  const groups = new Map();

  for (const row of rows) {
    if (!row[field]) continue;
    const group = groups.get(row[field]) ?? [];
    group.push(row.pagePath);
    groups.set(row[field], group);
  }

  return [...groups.entries()]
    .filter(([, pages]) => pages.length > 1)
    .map(([value, pages]) => `${JSON.stringify(value)}: ${pages.join(", ")}`);
}

function addFindings(target, issue, rows, formatter = (row) => row) {
  for (const row of rows) {
    target.push(`${issue}: ${formatter(row)}`);
  }
}

function printFindings(title, findings) {
  console.log(`\n${title}: ${findings.length}`);
  for (const finding of findings.slice(0, reportLimit)) {
    console.log(`- ${finding}`);
  }
  if (findings.length > reportLimit) {
    console.log(`- ...${findings.length - reportLimit} more`);
  }
}

const entries = contentRoots.flatMap(({ kind, dir }) =>
  filesIn(dir, (file) => /\.mdx?$/.test(file)).map((file) =>
    parseContentFile(file, kind),
  ),
);
const posts = entries.filter((entry) => entry.kind === "post");
const pages = entries.filter((entry) => entry.kind === "page");
const postIds = new Set(posts.map((post) => post.id));

addFindings(
  errors,
  "Missing frontmatter title",
  entries.filter((entry) => !entry.title),
  (entry) => entry.file,
);
addFindings(
  errors,
  "Missing frontmatter description",
  entries.filter((entry) => !entry.description),
  (entry) => entry.file,
);

const missingCovers = posts.filter((entry) => !entry.coverImage);
const remoteCovers = posts.filter((entry) =>
  /^https?:\/\//.test(entry.coverImage),
);
const thinPosts = posts.filter((entry) => entry.words > 0 && entry.words < 250);

if (missingCovers.length) {
  opportunities.push(
    `${missingCovers.length} posts use the site-wide social image fallback`,
  );
}
if (remoteCovers.length) {
  opportunities.push(
    `${remoteCovers.length} posts depend on remote Unsplash social images`,
  );
}
if (thinPosts.length) {
  opportunities.push(
    `${thinPosts.length} posts are under 250 words; improve or consolidate based on Search Console demand`,
  );
}

if (!existsSync(distRoot)) {
  errors.push("Missing dist/; run npm run build before the audit");
} else {
  const htmlFiles = filesIn(distRoot, (file) => file.endsWith(".html"));
  const renderedPages = htmlFiles.map((file) => {
    const $ = cheerio.load(readFileSync(file, "utf8"));
    const pagePath = pagePathFromHtml(file);
    const robots = $("meta[name='robots']").attr("content") ?? "";
    const redirect = $("meta[http-equiv='refresh']").length > 0;
    const schemas = $("script[type='application/ld+json']")
      .map((_, element) => $(element).text())
      .get();
    const schemaValues = [];
    const invalidSchemas = [];

    for (const schema of schemas) {
      try {
        schemaValues.push(JSON.parse(schema));
      } catch {
        invalidSchemas.push(schema);
      }
    }

    const localArticleImagesWithoutDimensions = $(
      ".article-content img",
    ).filter((_, element) => {
      const image = $(element);
      const src = image.attr("src") ?? "";
      const isProjectGallery = image.parents(".project-gallery").length > 0;
      const isProjectPreview = image.parents(".project-preview").length > 0;
      const isPortfolioCard = image.parents(".portfolio-card-media").length > 0;
      return (
        src.startsWith("/") &&
        !isProjectGallery &&
        !isProjectPreview &&
        !isPortfolioCard &&
        (!image.attr("width") || !image.attr("height"))
      );
    }).length;

    return {
      file,
      pagePath,
      title: $("title").text().trim(),
      description: $("meta[name='description']").attr("content")?.trim() ?? "",
      canonical: $("link[rel='canonical']").attr("href") ?? "",
      robots,
      noindex: robots.toLowerCase().includes("noindex"),
      redirect,
      h1Count: $("h1").length,
      missingAltCount: $("img:not([alt])").length,
      emptyAltCount: $("img[alt='']").length,
      localArticleImagesWithoutDimensions,
      invalidSchemaCount: invalidSchemas.length,
      schemaValues,
      $,
    };
  });

  const indexablePages = renderedPages.filter(
    (page) => !page.noindex && !page.redirect && page.pagePath !== "/404.html",
  );

  addFindings(
    errors,
    "Missing title",
    indexablePages.filter((page) => !page.title),
    (page) => page.pagePath,
  );
  addFindings(
    warnings,
    "Title exceeds 60 characters",
    indexablePages.filter((page) => page.title.length > 60),
    (page) => `${page.pagePath} (${page.title.length})`,
  );
  addFindings(
    errors,
    "Missing meta description",
    indexablePages.filter((page) => !page.description),
    (page) => page.pagePath,
  );
  addFindings(
    warnings,
    "Meta description is under 70 characters",
    indexablePages.filter(
      (page) => page.description && page.description.length < 70,
    ),
    (page) => `${page.pagePath} (${page.description.length})`,
  );
  addFindings(
    warnings,
    "Meta description exceeds 160 characters",
    indexablePages.filter((page) => page.description.length > 160),
    (page) => `${page.pagePath} (${page.description.length})`,
  );
  addFindings(
    errors,
    "Page does not have exactly one H1",
    indexablePages.filter((page) => page.h1Count !== 1),
    (page) => `${page.pagePath} (${page.h1Count})`,
  );
  addFindings(
    errors,
    "Missing canonical URL",
    indexablePages.filter((page) => !page.canonical),
    (page) => page.pagePath,
  );
  addFindings(
    errors,
    "Canonical URL does not match the rendered route",
    indexablePages.filter(
      (page) => page.canonical !== absolutePageUrl(page.pagePath),
    ),
    (page) =>
      `${page.pagePath} (${page.canonical || "missing"} != ${absolutePageUrl(page.pagePath)})`,
  );
  addFindings(
    errors,
    "Invalid JSON-LD",
    indexablePages.filter((page) => page.invalidSchemaCount > 0),
    (page) => page.pagePath,
  );
  addFindings(
    errors,
    "Image is missing an alt attribute",
    indexablePages.filter((page) => page.missingAltCount > 0),
    (page) => `${page.pagePath} (${page.missingAltCount})`,
  );
  addFindings(
    warnings,
    "Local article image is missing width or height",
    indexablePages.filter(
      (page) => page.localArticleImagesWithoutDimensions > 0,
    ),
    (page) => `${page.pagePath} (${page.localArticleImagesWithoutDimensions})`,
  );

  const emptyAltImages = indexablePages.reduce(
    (total, page) => total + page.emptyAltCount,
    0,
  );
  if (emptyAltImages) {
    opportunities.push(
      `${emptyAltImages} rendered images use empty alt text; add descriptions when an image conveys content`,
    );
  }

  addFindings(
    warnings,
    "Duplicate title",
    groupDuplicates(indexablePages, "title"),
  );
  addFindings(
    warnings,
    "Duplicate meta description",
    groupDuplicates(indexablePages, "description"),
  );
  addFindings(
    errors,
    "Duplicate canonical URL",
    groupDuplicates(indexablePages, "canonical"),
  );

  for (const page of indexablePages) {
    const postId = page.pagePath.replace(/^\/|\/$/g, "");
    if (!postIds.has(postId)) continue;

    const blogPosting = page.schemaValues.find(
      (schema) => schema?.["@type"] === "BlogPosting",
    );
    if (!blogPosting) {
      errors.push(`Missing BlogPosting JSON-LD: ${page.pagePath}`);
    } else if (!blogPosting.datePublished) {
      warnings.push(`BlogPosting is missing datePublished: ${page.pagePath}`);
    }
  }

  const brokenLinks = new Set();
  const brokenImages = new Set();
  for (const page of renderedPages) {
    page.$("a[href]").each((_, element) => {
      const href = page.$(element).attr("href") ?? "";
      if (
        !href.startsWith("/") ||
        href.startsWith("//") ||
        href.startsWith("/#")
      ) {
        return;
      }
      if (!distPathExists(href)) {
        brokenLinks.add(`${page.pagePath} -> ${href}`);
      }
    });

    page.$("img[src]").each((_, element) => {
      const src = page.$(element).attr("src") ?? "";
      if (!src.startsWith("/") || src.startsWith("//")) return;
      if (!distPathExists(src)) {
        brokenImages.add(`${page.pagePath} -> ${src}`);
      }
    });
  }
  addFindings(errors, "Broken internal link", [...brokenLinks]);
  addFindings(errors, "Broken local image", [...brokenImages]);

  const sitemapFiles = filesIn(distRoot, (file) =>
    /sitemap-\d+\.xml$/.test(file),
  );
  const sitemapUrls = new Set(
    sitemapFiles
      .flatMap((file) => [
        ...readFileSync(file, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
      ])
      .map((match) => match[1]),
  );
  const indexableUrls = new Set(indexablePages.map((page) => page.canonical));

  addFindings(
    errors,
    "Indexable canonical missing from sitemap",
    [...indexableUrls].filter((url) => !sitemapUrls.has(url)),
  );
  addFindings(
    errors,
    "Non-indexable or unknown URL found in sitemap",
    [...sitemapUrls].filter((url) => !indexableUrls.has(url)),
  );

  const robotsPath = path.join(distRoot, "robots.txt");
  const robots = existsSync(robotsPath) ? readFileSync(robotsPath, "utf8") : "";
  if (!robots) {
    errors.push("robots.txt is missing");
  } else if (!robots.includes(`${siteUrl}/sitemap-index.xml`)) {
    errors.push("robots.txt does not reference sitemap-index.xml");
  }

  console.log("SEO audit");
  console.log(`Rendered indexable pages: ${indexablePages.length}`);
  console.log(`Content entries: ${posts.length} posts, ${pages.length} pages`);
}

printFindings("Errors", errors);
printFindings("Warnings", warnings);
printFindings("Opportunities", opportunities);

if (errors.length) {
  process.exitCode = 1;
} else {
  console.log("\nResult: PASS");
}
