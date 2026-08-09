import { feedbackProjects, feedbackStatuses } from "../../feedback/projects.js";

export const GITHUB_API_VERSION = "2026-03-10";
export const MAX_REQUEST_BYTES = 20_000;

const projectLookup = new Map();

for (const project of feedbackProjects) {
  projectLookup.set(project.id, project);
  for (const alias of project.aliases) projectLookup.set(alias, project);
}

export class HttpError extends Error {
  constructor(status, message, code = "request_failed") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function resolveProject(value) {
  if (typeof value !== "string") return undefined;
  return projectLookup.get(value.trim().toLowerCase());
}

export function parseAllowedOrigins(value = "") {
  return new Set(
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

export function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return parseAllowedOrigins(env.ALLOWED_ORIGINS).has(origin)
    ? origin
    : undefined;
}

export function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function jsonResponse(
  payload,
  status = 200,
  origin = null,
  extraHeaders = {},
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function normalizeSingleLine(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function normalizeParagraphs(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim().slice(0, maximumLength);
}

export function validateSubmission(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Invalid submission.", "invalid_submission");
  }

  const project = resolveProject(input.project);
  if (!project)
    throw new HttpError(400, "Choose a supported product.", "invalid_project");

  const type = normalizeSingleLine(input.type, 20).toLowerCase();
  if (type !== "bug" && type !== "idea") {
    throw new HttpError(
      400,
      "Choose bug report or feature idea.",
      "invalid_type",
    );
  }

  const title = normalizeSingleLine(input.title, 120);
  if (title.length < 6) {
    throw new HttpError(
      400,
      "Use at least 6 characters for the title.",
      "invalid_title",
    );
  }

  const description = normalizeParagraphs(input.description, 5_000);
  if (description.length < 20) {
    throw new HttpError(
      400,
      "Add at least 20 characters of detail.",
      "invalid_description",
    );
  }

  const email = normalizeSingleLine(input.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(
      400,
      "Enter a valid email address or leave it blank.",
      "invalid_email",
    );
  }

  const turnstileToken = normalizeSingleLine(input.turnstileToken, 2_048);
  if (!turnstileToken) {
    throw new HttpError(
      400,
      "Complete the spam check and try again.",
      "missing_turnstile",
    );
  }

  return {
    project,
    type,
    title,
    description,
    email,
    appVersion: normalizeSingleLine(input.appVersion, 100),
    osVersion: normalizeSingleLine(input.osVersion, 100),
    source: normalizeSingleLine(input.source, 80) || "website",
    turnstileToken,
    website: normalizeSingleLine(input.website, 200),
  };
}

export function buildIssueBody(submission) {
  const context = [
    `- Product: ${submission.project.name}`,
    `- Type: ${submission.type === "bug" ? "Bug report" : "Feature idea"}`,
    `- Source: ${submission.source || "website"}`,
    `- App version: ${submission.appVersion || "Not provided"}`,
    `- OS version: ${submission.osVersion || "Not provided"}`,
    `- Contact email: ${submission.email || "Not provided"}`,
  ].join("\n");

  return [
    "<!-- feedback:v1 -->",
    "## Details",
    submission.description,
    "",
    "## Submission context",
    context,
    "",
    "> Submitted anonymously through hoyelam.com. Keep contact details private when publishing this ticket.",
  ].join("\n");
}

export function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "hoyelam-feedback-worker",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

export function tokenForProject(project, env) {
  return env[project.tokenBinding] || env.GITHUB_TOKEN;
}

export function statusFromLabels(labels) {
  const names = new Set(
    labels.map((label) => (typeof label === "string" ? label : label.name)),
  );
  for (const status of [...feedbackStatuses].reverse()) {
    if (names.has(`status:${status.id}`)) return status.id;
  }
  return "review";
}

function typeFromLabels(labels) {
  const names = new Set(
    labels.map((label) => (typeof label === "string" ? label : label.name)),
  );
  return names.has("type:idea") ? "idea" : "bug";
}

export function extractPublicDescription(body = "") {
  const match = body.match(
    /## Details\s*\n([\s\S]*?)(?=\n## Submission context|$)/i,
  );
  if (!match) return "";
  const text = match[1]
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 280 ? `${text.slice(0, 277).trimEnd()}…` : text;
}

export function sanitizePublicIssue(issue, project) {
  return {
    id: `${project.id}-${issue.number}`,
    number: issue.number,
    project: project.id,
    projectName: project.name,
    type: typeFromLabels(issue.labels || []),
    status: statusFromLabels(issue.labels || []),
    title: normalizeSingleLine(issue.title, 120),
    description: extractPublicDescription(issue.body || ""),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}
