import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/index.js";

const env = {
  ALLOWED_ORIGINS: "https://hoyelam.com",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  GITHUB_TOKEN_HOYELAM: "github-token-a",
  GITHUB_TOKEN_KIN_YEE: "github-token-b",
  AI: { run: async () => ({ response: "safe" }) },
};

function request(path, init = {}) {
  return new Request(`https://feedback.example${path}`, {
    ...init,
    headers: {
      Origin: "https://hoyelam.com",
      ...(init.headers || {}),
    },
  });
}

test("rejects browser requests from unknown origins", async () => {
  const response = await handleRequest(
    new Request("https://feedback.example/v1/tickets", {
      headers: { Origin: "https://attacker.example" },
    }),
    env,
    undefined,
    { fetchImpl: async () => assert.fail("fetch should not run"), cache: null },
  );
  assert.equal(response.status, 403);
});

test("routes a submission to the allowlisted repository", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true });
    }
    return Response.json({ number: 17 }, { status: 201 });
  };

  const response = await handleRequest(
    request("/v1/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "thinkdrop-2",
        type: "idea",
        title: "Add an optional weekly reminder",
        description:
          "I would like a weekly reminder to revisit thoughts that have not appeared recently.",
        turnstileToken: "valid-token",
      }),
    }),
    env,
    undefined,
    { fetchImpl, cache: null },
  );

  assert.equal(response.status, 201);
  assert.match(calls[1].url, /repos\/Kin-yee\/think-drop\/issues$/);
  assert.equal(calls[1].init.headers.Authorization, "Bearer github-token-b");
  const issue = JSON.parse(calls[1].init.body);
  assert.deepEqual(issue.labels, ["feedback", "type:idea", "status:review"]);
});

test("rejects unsafe content before creating a GitHub issue", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return Response.json({ success: true });
  };

  const response = await handleRequest(
    request("/v1/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "loudscript-mac",
        type: "bug",
        title: "An unsafe abusive submission",
        description:
          "This test represents content that the moderation model has classified as unsafe.",
        turnstileToken: "valid-token",
      }),
    }),
    { ...env, AI: { run: async () => ({ response: "unsafe\nS10" }) } },
    undefined,
    { fetchImpl, cache: null },
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "unsafe_content");
  assert.equal(calls.length, 1);
  assert.match(calls[0], /siteverify/);
});

test("aggregates sanitized public issues from every configured repository", async () => {
  const fetchImpl = async (url) => {
    const repository = String(url).match(/\/repos\/([^?]+)\/issues/)?.[1];
    const project = repository || "Unknown";
    return Response.json([
      {
        number: project.length,
        title: `${project} ticket`,
        body: `## Details\nA public description for ${project}.\n\n## Submission context\n- Contact email: private@example.com`,
        labels: [
          { name: "feedback" },
          { name: "public" },
          { name: "status:planned" },
        ],
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-02T00:00:00Z",
      },
    ]);
  };

  const response = await handleRequest(request("/v1/tickets"), env, undefined, {
    fetchImpl,
    cache: null,
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.tickets.length, 5);
  assert.deepEqual(payload.unavailableProjects, []);
  assert.equal(JSON.stringify(payload).includes("private@example.com"), false);
});
