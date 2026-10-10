import { getProjectSlug, projects } from "./projects";

// Active independent projects share their names, URLs, and descriptions with the portfolio.
export const projectLinks = projects.flatMap((project) =>
  project.status === "Current" &&
  ["Creator", "Co-founder"].includes(project.role) &&
  project.href
    ? [{ ...project, href: project.href, slug: getProjectSlug(project) }]
    : [],
);

export const personalLinks = [
  {
    title: "Writing",
    description: "Candid thoughts on work & life",
    href: "/writing/",
  },
  {
    title: "Portfolio",
    description: "Everything I’ve worked on",
    href: "/portfolio/",
  },
];

export const socialLinks = [
  { title: "Instagram", href: "https://www.instagram.com/hoyelam/" },
  { title: "X", href: "https://x.com/hoyelam" },
  { title: "GitHub", href: "https://github.com/hoyelam" },
  { title: "Spotify", href: "https://open.spotify.com/user/hoye140" },
];
