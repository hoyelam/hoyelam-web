import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { getProjectSlug, hasProjectPage, projects } from "./src/data/projects.ts";
import rehypeImageAttributes from "./src/lib/rehype-image-attributes.mjs";

// Project pages that were live under /portfolio/ before the rename to /projects/.
const legacyPortfolioSlugs = [
  "bachelor-thesis",
  "craftcaption",
  "devleads",
  "esports-calendar",
  "esportsfort",
  "growrilla",
  "human-tracking-drone",
  "kowa",
  "mywatchlist",
  "oncircleci",
  "pcbuild",
  "projectcampus",
  "smart-mirror",
  "somnox",
  "startup-story",
  "think-drop",
  "xpensemap",
];
const projectPageSlugs = new Set(projects.filter(hasProjectPage).map(getProjectSlug));
const legacyPortfolioRedirects = Object.fromEntries(
  legacyPortfolioSlugs.map((slug) => [
    `/portfolio/${slug}`,
    projectPageSlugs.has(slug) ? `/projects/${slug}/` : "/projects/",
  ]),
);

export default defineConfig({
  site: "https://hoyelam.com",
  trailingSlash: "always",
  redirects: {
    "/kin-yee": "/projects/",
    "/portfolio": "/projects/",
    ...legacyPortfolioRedirects,
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !["https://hoyelam.com/kin-yee/", "https://hoyelam.com/me/"].includes(page),
    }),
  ],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeImageAttributes] }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    },
  },
});
