import { getCollection, type CollectionEntry } from "astro:content";

type Post = CollectionEntry<"posts">;

const relatedStopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "app",
  "daily",
  "day",
  "for",
  "from",
  "have",
  "how",
  "into",
  "ios",
  "more",
  "new",
  "not",
  "that",
  "the",
  "this",
  "using",
  "with",
  "you",
  "your",
]);

function relatedTerms(post: Post) {
  return new Set(
    `${post.data.title} ${post.data.description ?? ""}`
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((term) => term.length > 2 && !relatedStopWords.has(term)) ?? [],
  );
}

export function getRelatedPosts(post: Post, posts: Post[], limit = 3) {
  const manualPosts = post.data.relatedPosts
    .map((id) => posts.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Post => Boolean(candidate));
  const manualIds = new Set(manualPosts.map(({ id }) => id));
  const sourceTerms = relatedTerms(post);
  const ranked = posts
    .filter(
      (candidate) => candidate.id !== post.id && !manualIds.has(candidate.id),
    )
    .map((candidate) => {
      const sharedTerms = [...relatedTerms(candidate)].filter((term) =>
        sourceTerms.has(term),
      ).length;
      return {
        candidate,
        score: sharedTerms + (candidate.data.featured ? 0.25 : 0),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        (b.candidate.data.publishedAt?.getTime() ?? 0) -
        (a.candidate.data.publishedAt?.getTime() ?? 0)
      );
    });

  return [...manualPosts, ...ranked.map(({ candidate }) => candidate)].slice(
    0,
    limit,
  );
}

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
