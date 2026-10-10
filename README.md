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
It uses the site's light/dark theme and social preview metadata.

Active projects with a `Creator` or `Co-founder` role and a URL in `src/data/projects.ts`
appear automatically. Update that file to change project names, descriptions, links,
or status. Edit `src/data/links.ts` for personal and social links, and
`src/pages/links.astro` for the profile introduction.

Official project icons are stored in `src/assets/links/` and mapped in
`src/data/links.ts`. Astro generates small WebP versions for the link cards.
When adding a project, add its real icon to this mapping; projects without an
icon still render their name and description.

Asset sources (retrieved October 10, 2026):

- [LoudScript app icon](https://loudscript.app/apple-touch-icon.png)
- [Waterfuze brand mark](https://waterfuze.com/cdn/shop/files/LOGO_transparent_1.png?v=1696692664&width=180)
- [Websave app icon](https://websave.app/images/AppLogo.png)
- [Thinkdrop app icon](https://thinkdrop.app/images/AppLogo.png)

## Deployment

The GitHub Pages workflow builds Astro and deploys `dist/`. The custom domain file is `public/CNAME`.
