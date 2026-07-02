import rss from "@astrojs/rss";
import { getPosts } from "../lib/content";

export async function GET(context) {
  const posts = await getPosts();

  return rss({
    title: "Hoye Lam",
    description: "Portfolio, apps, writing, and notes by Hoye Lam.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/${post.id}/`,
    })),
  });
}
