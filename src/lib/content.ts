import { getCollection } from "astro:content";

export async function getPosts() {
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  return posts.sort((a, b) => {
    const aTime = a.data.publishedAt?.getTime() ?? 0;
    const bTime = b.data.publishedAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export async function getPages() {
  return getCollection("pages", ({ data }) => !data.draft);
}
