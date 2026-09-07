export const SITE_NAME = "Hoye Lam";
export const SITE_URL = "https://hoyelam.com";
export const HOME_SITE_TITLE =
  "Hoye Lam — iOS Engineer, Indie App Builder & Writer";
export const DEFAULT_SITE_DESCRIPTION =
  "Useful software and candid writing about building, work, and life by Hoye Lam.";
export const HOME_SITE_DESCRIPTION =
  "I’m Hoye Lam, a senior software engineer at DeepL specializing in software for Apple platforms. I build useful indie apps and write candidly about work and life.";
export const DEFAULT_SOCIAL_IMAGE = "/images/hoye-lam-og.png";
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "Hoye Lam, software engineer, indie app builder, and writer.";
export const DEFAULT_SOCIAL_IMAGE_WIDTH = 1200;
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = 630;
export const MAX_META_DESCRIPTION_LENGTH = 160;
export const MIN_META_DESCRIPTION_LENGTH = 70;

type EntryLike = {
  body?: string;
  id?: string;
  data: {
    title: string;
    description?: string;
    coverImage?: string;
    publishedAt?: Date;
    updatedAt?: Date;
  };
};

export function toAbsoluteUrl(
  value: string | undefined,
  site: string | URL | undefined = SITE_URL,
) {
  if (!value) return undefined;
  return value.startsWith("http")
    ? value
    : new URL(value, site ?? SITE_URL).toString();
}
export function normalizeDescription(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

function cleanExcerptLine(line: string) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBodyExcerptLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) return false;
  if (trimmed.startsWith("![")) return false;
  if (trimmed.startsWith("Embedded media")) return false;
  if (trimmed.startsWith("import ")) return false;
  if (/^_.*_$/.test(trimmed) || /^\*.*\*$/.test(trimmed)) return false;

  return true;
}

export function truncateText(value: string, maxLength = 160) {
  const text = value.trim();
  if (text.length <= maxLength) return text;

  const contentLength = Math.max(1, maxLength - 1);
  const truncated = text.slice(0, contentLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const visibleText = truncated
    .slice(0, lastSpace > 0 ? lastSpace : contentLength)
    .trim();
  return `${visibleText}…`;
}

export function getEntryExcerpt(
  entry: Pick<EntryLike, "body">,
  maxLength = 280,
) {
  const lines =
    entry.body
      ?.split("\n")
      .filter(isBodyExcerptLine)
      .map(cleanExcerptLine)
      .filter(Boolean)
      .slice(0, 3) ?? [];

  return truncateText(lines.join(" "), maxLength);
}

export function getSeoDescription(
  entry: EntryLike,
  fallback = DEFAULT_SITE_DESCRIPTION,
) {
  const explicitDescription = normalizeDescription(entry.data.description);
  const excerpt = getEntryExcerpt(entry, MAX_META_DESCRIPTION_LENGTH);

  if (!explicitDescription) {
    return excerpt || fallback;
  }

  if (explicitDescription.length >= MIN_META_DESCRIPTION_LENGTH) {
    return truncateText(explicitDescription, MAX_META_DESCRIPTION_LENGTH);
  }

  if (!excerpt) {
    return explicitDescription;
  }

  const normalizedExplicit = explicitDescription.toLocaleLowerCase();
  const normalizedExcerpt = excerpt.toLocaleLowerCase();
  const combinedDescription =
    normalizedExcerpt.includes(normalizedExplicit) ||
    normalizedExplicit.includes(normalizedExcerpt)
      ? excerpt
      : `${explicitDescription} ${excerpt}`;

  return truncateText(combinedDescription, MAX_META_DESCRIPTION_LENGTH);
}

export function getEntryImage(entry: EntryLike) {
  return entry.data.coverImage || DEFAULT_SOCIAL_IMAGE;
}

export function getEntryImageAlt(entry: EntryLike) {
  return `${entry.data.title} by ${SITE_NAME}`;
}
