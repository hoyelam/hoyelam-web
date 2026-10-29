import assert from "node:assert/strict";
import test from "node:test";
import { getProjectLinks } from "../src/lib/project-links.ts";
import type { Project } from "../src/data/projects.ts";

const project = (overrides: Partial<Project> = {}): Project => ({
  name: "An app",
  description: "An independent project",
  role: "Creator",
  period: "2026",
  portfolioTier: "featured",
  href: "https://example.com/",
  ...overrides,
});

test("renaming a project preserves its logo and URL", () => {
  const icon = {
    image: {
      src: "/icon.png",
      width: 180,
      height: 180,
      format: "png" as const,
    },
    dataUrl: "data:image/png;base64,test",
  };
  const original = project({ name: "Thinkdrop 2", links: { icon } });
  const [renamed] = getProjectLinks([{ ...original, name: "Thinkdrop" }]);
  assert.equal(renamed.name, "Thinkdrop");
  assert.equal(renamed.icon, icon);
  assert.equal(renamed.href, original.href);
});

test("only current independent projects with destinations are included", () => {
  assert.deepEqual(
    getProjectLinks([
      project({ portfolioTier: "archive", links: { featured: true } }),
      project({ role: "Senior Software Engineer" }),
      project({ href: undefined }),
      project({ href: "" }),
      project({ name: "Co-founded", role: "Co-founder" }),
      project({ name: "Founded", role: "Founder" }),
    ]).map((item) => item.name),
    ["Co-founded", "Founded"],
  );
});

test("featured and explicit ordering are independent of portfolio order", () => {
  const input = [
    project({ name: "Unconfigured" }),
    project({ name: "Second", links: { order: 20 } }),
    project({ name: "Featured", links: { order: 90, featured: true } }),
    project({ name: "First", links: { order: 10 } }),
  ];
  const before = input.slice();
  const expected = ["Featured", "First", "Second", "Unconfigured"];
  assert.deepEqual(
    getProjectLinks(input).map((item) => item.name),
    expected,
  );
  assert.deepEqual(
    getProjectLinks([...input].reverse()).map((item) => item.name),
    expected,
  );
  assert.deepEqual(input, before);
});

test("two active featured projects fail with a useful configuration error", () => {
  assert.throws(
    () =>
      getProjectLinks([
        project({ links: { featured: true } }),
        project({ links: { featured: true } }),
      ]),
    /Only one active project can be featured/,
  );
});
