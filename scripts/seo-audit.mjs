import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const contentRoots = [
  { kind: "post", dir: path.join(root, "src/content/posts") },
  { kind: "page", dir: path.join(root, "src/content/pages") },
];

function filesIn(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .sort()
    .map((file) => path.join(dir, file));
}

function filesInRecursive(dir, extension) {
  return readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file);
    return statSync(fullPath).isDirectory()
      ? filesInRecursive(fullPath, extension)
      : fullPath.endsWith(extension)
        ? [fullPath]
        : [];
  });
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function parseFile(file, kind) {
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
    file: path.relative(root, file),
    title: frontmatterValue(frontmatter, "title"),
    description: frontmatterValue(frontmatter, "description"),
    coverImage: frontmatterValue(frontmatter, "coverImage"),
    words: text ? text.split(/\s+/).length : 0,
  };
}

const entries = contentRoots.flatMap(({ kind, dir }) =>
  filesIn(dir).map((file) => parseFile(file, kind)),
);

const posts = entries.filter((entry) => entry.kind === "post");
const pages = entries.filter((entry) => entry.kind === "page");
const missingDescriptions = entries.filter((entry) => !entry.description);
const missingCovers = posts.filter((entry) => !entry.coverImage);
const remoteCovers = posts.filter((entry) =>
  /^https?:\/\//.test(entry.coverImage),
);
const thinPosts = posts.filter((entry) => entry.words > 0 && entry.words < 250);

function printSection(title, rows, formatter = (row) => row.file) {
  console.log(`\n${title}: ${rows.length}`);
  rows.slice(0, 25).forEach((row) => console.log(`- ${formatter(row)}`));
  if (rows.length > 25) console.log(`- ...${rows.length - 25} more`);
}

console.log("SEO audit");
console.log(`Posts: ${posts.length}`);
console.log(`Pages: ${pages.length}`);
printSection("Missing descriptions", missingDescriptions);
printSection("Posts missing coverImage", missingCovers);
printSection("Posts with remote coverImage", remoteCovers);
printSection(
  "Potential thin posts under 250 words",
  thinPosts,
  (row) => `${row.file} (${row.words} words)`,
);

const dist = path.join(root, "dist");
if (existsSync(dist)) {
  const renderedLocalImages = filesInRecursive(dist, ".html").flatMap(
    (file) => {
      const $ = load(readFileSync(file, "utf8"));
      return $("img[src^='/']")
        .map((_, image) => ({
          file: path.relative(root, file),
          src: $(image).attr("src"),
          width: $(image).attr("width"),
          height: $(image).attr("height"),
        }))
        .get();
    },
  );
  const missingRenderedDimensions = renderedLocalImages.filter(
    (image) => !image.width || !image.height,
  );

  console.log(`\nRendered local images: ${renderedLocalImages.length}`);
  printSection(
    "Rendered local images missing dimensions",
    missingRenderedDimensions,
    (image) => `${image.file}: ${image.src}`,
  );
  if (missingRenderedDimensions.length) process.exitCode = 1;
} else {
  console.log("\nRendered image audit skipped: run npm run build first.");
}
