import { projects } from "./projects";
import { getProjectLinks } from "../lib/project-links";

export const linksDescription =
  "Hoye Lam’s apps, writing, and social profiles in one place.";

export const projectLinks = getProjectLinks(projects);

export const personalLinks = [
  {
    title: "Writing",
    description: "Thoughts on work and life",
    href: "/writing/",
  },
  {
    title: "Portfolio",
    description: "Everything I’ve worked on",
    href: "/portfolio/",
  },
];
