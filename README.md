# hoyelam.com

Static portfolio and writing site for `hoyelam.com`, designed to replace the Ghost-hosted site with GitHub Pages.

## Development

```sh
npm install
npm run dev
```

## Import from Ghost

Export Ghost from **Settings → Advanced → Import/Export → Export**. Then run:

```sh
npm run import:ghost -- /path/to/ghost-export.json --download-images
```

The importer writes:

- posts to `src/content/posts/*.mdx`
- pages to `src/content/pages/*.mdx`
- downloaded Ghost images to `public/images/imported/...`

Legacy post and page URLs are preserved as top-level routes, for example:

- `/how-to-perform-image-classification-on-ios/`
- `/portfolio/`
- `/about/`

## Import from the current live Ghost site

If the Ghost export is not available yet, seed content from public HTML:

```sh
npm run import:live -- --download-images
```

The live importer reads `https://hoyelam.com/sitemap-posts.xml` and `https://hoyelam.com/sitemap-pages.xml`.

## Personal links page

`/links/` is the public page to share in social profiles (`https://hoyelam.com/links/`).
The shorter address `https://hoyelam.com/me` opens the same page and is suitable
for social bios. Both addresses share the same layout and social preview metadata;
`/links/` remains the canonical URL for search engines.
It uses the site's light/dark theme.

Current projects with a `Creator` or `Co-founder` role and a URL in
`src/data/projects.ts` appear automatically. Each project's optional `links` record
controls its logo, display order (lower numbers first), and featured status:

```ts
links: { icon: linkIcons.loudscript, order: 10, featured: true }
```

The featured project appears first; at most one current project can be featured.
Unconfigured projects follow the ordered ones. Changing this order does not change
the portfolio, and renaming a project preserves its logo. Archived projects disappear
automatically, including from the sharing image.

Official icons live in `src/assets/links/` and are registered in
`src/data/link-icons.ts` for both Astro's optimized page images and the sharing image.
Use the same asset for each icon's regular and inline imports. Add the icon to the
project's `links` record rather than matching its display name.

`src/pages/links/og.png.ts` generates a static 1200×630 PNG during the build using the
existing portrait and the first four active project logos in links-page order.
The page's Open Graph and Twitter metadata point to `/links/og.png`. Its evergreen
page description lives in `src/data/links.ts` and does not enumerate project names.

Run `npm test` for link configuration regression checks. Pull requests run these
checks, the Astro type check/build, and `scripts/seo-audit.mjs` through
`.github/workflows/validate.yml`.

Asset sources (retrieved October 10, 2026):

- [LoudScript app icon](https://loudscript.app/apple-touch-icon.png)
- [Waterfuze brand mark](https://waterfuze.com/cdn/shop/files/LOGO_transparent_1.png?v=1696692664&width=180)
- [Websave app icon](https://websave.app/images/AppLogo.png)
- [Thinkdrop app icon](https://thinkdrop.app/images/AppLogo.png)

## Deployment

The GitHub Pages workflow builds Astro and deploys `dist/`. The custom domain file is `public/CNAME`.
