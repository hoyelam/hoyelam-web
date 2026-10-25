import rss from "@astrojs/rss";
import { getPosts } from "@lib/content";
import {
  DEFAULT_SITE_DESCRIPTION,
  getEntryExcerpt,
  getSeoDescription,
  MAX_META_DESCRIPTION_LENGTH,
  SITE_NAME,
} from "@lib/seo";

export async function GET(context) {
  const posts = await getPosts();

  return rss({
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: getEntryExcerpt(post, MAX_META_DESCRIPTION_LENGTH) || getSeoDescription(post),
      pubDate: post.data.publishedAt,
      link: `/${post.id}/`,
    })),
  });
}
