import type { Project } from "../data/projects.ts";

export function getProjectLinks(projects: readonly Project[]) {
  const links = projects.flatMap((project) =>
    project.portfolioTier === "featured" &&
    ["Creator", "Founder", "Co-founder"].includes(project.role) &&
    project.href
      ? [{ ...project, href: project.href, ...project.links }]
      : [],
  );

  if (links.filter((project) => project.featured).length > 1) {
    throw new Error(
      "Only one active project can be featured on the links page.",
    );
  }

  return links.sort(
    (a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
  );
}
