# hoyelam.com

Personal writing and portfolio site, built with Astro. Posts and pages are MDX files in `src/content/`. The GitHub Pages workflow builds the site on every push to `main` and once a day, then deploys `dist/`. The custom domain is set in `public/CNAME`.

```sh
npm install
npm run dev        # local server at http://localhost:4321
npm run build      # astro check, then build to dist/
npm run preview    # serve the built dist/
npm test           # links page configuration checks
npm run seo:audit  # build, then check the built pages for SEO errors
npm run format     # format source files with Prettier
```

Pull requests run `npm test`, the build, and the SEO audit through `.github/workflows/validate.yml`.

The feedback form posts to a Cloudflare Worker in `worker/`, which files each submission as a GitHub issue. See `docs/feedback-system.md` for setup and deployment. `docs/links-page.md` covers the `/links/` page, and `docs/seo-measurement.md` lists the Search Console checks.
