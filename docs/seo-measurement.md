# SEO Measurement Checklist

Use this after deployment and before larger content imports.

## Search Console Setup

1. Add `https://hoyelam.com/` as a URL-prefix or domain property in Google Search Console.
2. Submit `https://hoyelam.com/sitemap-index.xml`.
3. Add the site to Bing Webmaster Tools and import from Google Search Console if available.
4. Confirm these URLs return `200` after deploy:
   - `https://hoyelam.com/robots.txt`
   - `https://hoyelam.com/sitemap-index.xml`
   - `https://hoyelam.com/rss.xml`

## Weekly Checks

Review these metrics in Google Search Console:

- Search results: clicks, impressions, CTR, and average position.
- Pages: indexed pages, crawled but not indexed, duplicate canonical warnings, and soft 404s.
- Sitemaps: latest read date and discovered URL count.
- Top pages: posts with impressions but low CTR; improve title and description first.
- Top queries: queries where a page ranks on positions 5-20; strengthen internal links and headings.

## Index Quality Policy

Keep posts indexed by default. Only add `noindex` when a page is intentionally low-value for search, duplicated elsewhere, private-adjacent, or too thin to improve.

Prefer this order:

1. Improve the post with a clearer title, description, headings, and internal links.
2. Consolidate related short posts into a stronger topic page.
3. Add `noindex` only when the page should remain public but not compete in search.

Run `npm run seo:audit` before publishing large batches of imported content.
