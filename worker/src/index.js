import { feedbackProjects } from "../../feedback/projects.js";
import {
  HttpError,
  MAX_REQUEST_BYTES,
  allowedOrigin,
  buildIssueBody,
  corsHeaders,
  githubHeaders,
  jsonResponse,
  resolveProject,
  sanitizePublicIssue,
  tokenForProject,
  validateSubmission,
} from "./core.js";

const DEFAULT_GITHUB_API = "https://api.github.com";
const CACHE_SECONDS = 300;
const MODERATION_MODEL = "@cf/meta/llama-guard-3-8b";

function githubApiUrl(env) {
  return (env.GITHUB_API_URL || DEFAULT_GITHUB_API).replace(/\/$/, "");
}

async function verifyTurnstile(submission, request, env, fetchImpl) {
  if (!env.TURNSTILE_SECRET_KEY) {
    throw new HttpError(
      503,
      "Feedback service is not configured.",
      "service_not_configured",
    );
  }

  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", submission.turnstileToken);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetchImpl(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    },
  );
  if (!response.ok) {
    throw new HttpError(
      503,
      "Spam protection is temporarily unavailable.",
      "turnstile_unavailable",
    );
  }

  const result = await response.json();
  if (!result.success) {
    throw new HttpError(
      400,
      "Spam check expired or failed. Try again.",
      "turnstile_failed",
    );
  }
}

async function moderateSubmission(submission, env) {
  if (!env.AI?.run) {
    throw new HttpError(
      503,
      "Feedback moderation is not configured.",
      "moderation_not_configured",
    );
  }

  let result;
  try {
    result = await env.AI.run(MODERATION_MODEL, {
      messages: [
        {
          role: "user",
          content: `Product feedback title: ${submission.title}\n\nProduct feedback details:\n${submission.description}`,
        },
      ],
      max_tokens: 64,
      temperature: 0,
    });
  } catch {
    throw new HttpError(
      503,
      "Content safety check is temporarily unavailable.",
      "moderation_unavailable",
    );
  }

  const verdict = typeof result === "string" ? result : result?.response;
  if (typeof verdict !== "string") {
    throw new HttpError(
      503,
      "Content safety check is temporarily unavailable.",
      "moderation_unavailable",
    );
  }

  const normalizedVerdict = verdict.trim().toLowerCase();
  if (normalizedVerdict.startsWith("unsafe")) {
    throw new HttpError(
      400,
      "Please remove unsafe or abusive content and try again.",
      "unsafe_content",
    );
  }
  if (!normalizedVerdict.startsWith("safe")) {
    throw new HttpError(
      503,
      "Content safety check is temporarily unavailable.",
      "moderation_unavailable",
    );
  }
}

async function createGithubIssue(submission, env, fetchImpl) {
  const token = tokenForProject(submission.project, env);
  if (!token) {
    throw new HttpError(
      503,
      "This product is not configured for feedback yet.",
      "project_not_configured",
    );
  }

  const response = await fetchImpl(
    `${githubApiUrl(env)}/repos/${submission.project.repository}/issues`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({
        title: submission.title,
        body: buildIssueBody(submission),
        labels: ["feedback", `type:${submission.type}`, "status:review"],
      }),
    },
  );

  if (!response.ok) {
    const status =
      response.status === 401 || response.status === 403 ? 503 : 502;
    throw new HttpError(
      status,
      "Ticket creation failed. Try again later.",
      "github_create_failed",
    );
  }

  return response.json();
}

async function readRequestJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(
      415,
      "Send the form as JSON.",
      "unsupported_media_type",
    );
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new HttpError(
      413,
      "Submission is too large.",
      "submission_too_large",
    );
  }

  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) {
    throw new HttpError(
      413,
      "Submission is too large.",
      "submission_too_large",
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(
      400,
      "Submission contains invalid JSON.",
      "invalid_json",
    );
  }
}

async function submitTicket(request, env, origin, fetchImpl) {
  const input = await readRequestJson(request);
  const submission = validateSubmission(input);

  // Honeypot submissions get a believable success response without creating an issue.
  if (submission.website) {
    return jsonResponse({ ok: true, queued: true }, 202, origin);
  }

  await verifyTurnstile(submission, request, env, fetchImpl);
  await moderateSubmission(submission, env);
  const issue = await createGithubIssue(submission, env, fetchImpl);

  return jsonResponse(
    {
      ok: true,
      reference: `${submission.project.id}-${issue.number}`,
    },
    201,
    origin,
  );
}

async function listProjectTickets(project, env, fetchImpl) {
  const token = tokenForProject(project, env);
  if (!token) throw new Error("missing_project_token");

  const params = new URLSearchParams({
    state: "all",
    labels: "feedback,public",
    sort: "updated",
    direction: "desc",
    per_page: "100",
  });
  const response = await fetchImpl(
    `${githubApiUrl(env)}/repos/${project.repository}/issues?${params}`,
    { headers: githubHeaders(token) },
  );

  if (!response.ok) throw new Error(`github_list_failed_${response.status}`);
  const issues = await response.json();
  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => sanitizePublicIssue(issue, project));
}

function requestedProjects(url) {
  const requested = url.searchParams.get("project");
  if (!requested || requested === "all") return feedbackProjects;
  const project = resolveProject(requested);
  if (!project)
    throw new HttpError(400, "Unknown product filter.", "invalid_project");
  return [project];
}

function cacheKey(url) {
  const project = url.searchParams.get("project") || "all";
  return new Request(
    `https://feedback-cache.invalid/tickets?project=${encodeURIComponent(project)}`,
  );
}

async function listTickets(request, env, origin, ctx, fetchImpl, cache) {
  const url = new URL(request.url);
  const key = cacheKey(url);
  const cached = cache ? await cache.match(key) : null;
  if (cached) {
    return jsonResponse(await cached.json(), 200, origin, {
      "Cache-Control": `public, max-age=60, s-maxage=${CACHE_SECONDS}`,
      "X-Feedback-Cache": "HIT",
    });
  }

  const projects = requestedProjects(url);
  const results = await Promise.allSettled(
    projects.map((project) => listProjectTickets(project, env, fetchImpl)),
  );
  const tickets = [];
  const unavailableProjects = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") tickets.push(...result.value);
    else unavailableProjects.push(projects[index].id);
  });

  tickets.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const payload = {
    tickets,
    unavailableProjects,
    generatedAt: new Date().toISOString(),
  };

  if (cache && unavailableProjects.length === 0) {
    const cachedResponse = new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      },
    });
    ctx.waitUntil(cache.put(key, cachedResponse));
  }

  return jsonResponse(payload, 200, origin, {
    "Cache-Control": `public, max-age=60, s-maxage=${CACHE_SECONDS}`,
    "X-Feedback-Cache": "MISS",
  });
}

export async function handleRequest(
  request,
  env,
  ctx = { waitUntil() {} },
  options = {},
) {
  const fetchImpl = options.fetchImpl || fetch;
  const cache =
    options.cache ?? (typeof caches === "undefined" ? null : caches.default);
  const origin = allowedOrigin(request, env);

  if (request.headers.has("Origin") && origin === undefined) {
    return jsonResponse(
      { error: "Origin is not allowed.", code: "origin_not_allowed" },
      403,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const url = new URL(request.url);

  try {
    if (url.pathname === "/v1/tickets" && request.method === "GET") {
      return await listTickets(request, env, origin, ctx, fetchImpl, cache);
    }
    if (url.pathname === "/v1/tickets" && request.method === "POST") {
      return await submitTicket(request, env, origin, fetchImpl);
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse({ ok: true }, 200, origin);
    }
    return jsonResponse(
      { error: "Not found.", code: "not_found" },
      404,
      origin,
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(
        { error: error.message, code: error.code },
        error.status,
        origin,
      );
    }
    return jsonResponse(
      {
        error: "Feedback service is temporarily unavailable.",
        code: "internal_error",
      },
      500,
      origin,
    );
  }
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
