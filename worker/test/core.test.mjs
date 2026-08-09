import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIssueBody,
  extractPublicDescription,
  resolveProject,
  sanitizePublicIssue,
  validateSubmission,
} from "../src/core.js";

const validInput = {
  project: "loudscript-mac",
  type: "bug",
  title: "Speech stops after changing voices",
  description:
    "Speech stops immediately after I switch to a different installed voice.",
  email: "reader@example.com",
  appVersion: "1.4.0",
  osVersion: "macOS 26.0",
  source: "mac-app",
  turnstileToken: "token",
};

test("project aliases resolve to the allowlisted project", () => {
  assert.equal(
    resolveProject("loud-script")?.repository,
    "hoyelam/LoudScript-mac",
  );
  assert.equal(
    resolveProject("loudscript-ios")?.repository,
    "Kin-yee/LoudScript",
  );
  assert.equal(
    resolveProject("spacepadx-ios")?.repository,
    "Kin-yee/spacepadx-ios",
  );
  assert.equal(resolveProject("thinkdrop-2")?.id, "thinkdrop");
  assert.equal(resolveProject("websnap-ios")?.id, "websave");
  assert.equal(resolveProject("unknown"), undefined);
});

test("submission validation normalizes fields", () => {
  const submission = validateSubmission({
    ...validInput,
    title: "  Speech\n stops  ",
  });
  assert.equal(submission.title, "Speech stops");
  assert.equal(submission.project.id, "loudscript-mac");
});

test("submission validation rejects repositories outside the allowlist", () => {
  assert.throws(
    () =>
      validateSubmission({
        ...validInput,
        project: "owner/arbitrary-repository",
      }),
    /supported product/,
  );
});

test("issue body keeps contact details outside the public details section", () => {
  const submission = validateSubmission(validInput);
  const body = buildIssueBody(submission);
  assert.match(body, /## Details/);
  assert.match(body, /reader@example\.com/);
  assert.equal(extractPublicDescription(body), validInput.description);
  assert.doesNotMatch(extractPublicDescription(body), /reader@example\.com/);
});

test("public issue output uses only the explicit public fields", () => {
  const project = resolveProject("loudscript-mac");
  const ticket = sanitizePublicIssue(
    {
      number: 42,
      title: "Speech stops",
      body: buildIssueBody(validateSubmission(validInput)),
      labels: [
        { name: "type:bug" },
        { name: "status:in-progress" },
        { name: "private-note" },
      ],
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-02T00:00:00Z",
      user: { login: "private-user" },
    },
    project,
  );

  assert.deepEqual(Object.keys(ticket), [
    "id",
    "number",
    "project",
    "projectName",
    "type",
    "status",
    "title",
    "description",
    "createdAt",
    "updatedAt",
  ]);
  assert.equal(ticket.status, "in-progress");
  assert.equal(JSON.stringify(ticket).includes("private-user"), false);
  assert.equal(JSON.stringify(ticket).includes("reader@example.com"), false);
});
