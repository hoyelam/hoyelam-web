import { projects } from "./projects";
import { getProjectLinks } from "../lib/project-links";

export const linksDescription =
  "Explore Hoye Lam’s latest apps and projects, read candid thoughts on work and life, and find his social profiles—all in one place.";

export const projectLinks = getProjectLinks(projects);

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
