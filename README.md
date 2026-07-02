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

## Deployment

The GitHub Pages workflow builds Astro and deploys `dist/`. The custom domain file is `public/CNAME`.
