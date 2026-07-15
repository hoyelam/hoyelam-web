import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeImageAttributes from "./scripts/rehype-image-attributes.mjs";

export default defineConfig({
  site: "https://hoyelam.com",
  trailingSlash: "always",
  redirects: {
    "/kin-yee": "/portfolio/",
  },
  integrations: [
    mdx(),
    sitemap({ filter: (page) => page !== "https://hoyelam.com/kin-yee/" }),
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
