import rss from "@astrojs/rss";
import { getPosts } from "../lib/content";
import { getEntryExcerpt, getSeoDescription } from "../lib/seo";

export async function GET(context) {
  const posts = await getPosts();

  return rss({
    title: "Hoye Lam",
    description: "Portfolio, apps, writing, and notes by Hoye Lam.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: getEntryExcerpt(post, 160) || getSeoDescription(post),
      pubDate: post.data.publishedAt,
      link: `/${post.id}/`,
    })),
  });
}
