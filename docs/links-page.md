# Personal links page

`/links/` is the public page to share in social profiles (`https://hoyelam.com/links/`).
The shorter address `https://hoyelam.com/me` opens the same page and is suitable
for social bios. Both addresses share the same layout and social preview metadata;
`/links/` remains the canonical URL for search engines.
It uses the site's light/dark theme.

Current projects with a `Creator`, `Founder` or `Co-founder` role and a URL in
`src/data/projects.ts` appear automatically. Each project's optional `links` record
controls its logo, display order (lower numbers first), and featured status:

```ts
links: { icon: linkIcons.esportsfort, order: 10 }
```

The same order drives the sidebar's Side products list and the home page's
"What I'm building" cards. Adding `featured: true` highlights a project with a
"Featured" label and moves it first; at most one current project can be featured,
and none is today. Unconfigured projects follow the ordered ones. Changing this
order does not change the Projects page, and renaming a project preserves its logo. Archived projects disappear
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

- Esportsfort app icon: `AppIcon.appiconset` in the Esportsfort iOS project, resized to 256 px (retrieved November 4, 2026)
- [Kin-Yee app icon](https://kin-yee.com/apple-touch-icon.png) (retrieved October 29, 2026)
- [LoudScript app icon](https://loudscript.app/apple-touch-icon.png)
- [Waterfuze brand mark](https://waterfuze.com/cdn/shop/files/LOGO_transparent_1.png?v=1696692664&width=180)
- [Websave app icon](https://websave.app/images/AppLogo.png)
- [Thinkdrop app icon](https://thinkdrop.app/images/AppLogo.png)
