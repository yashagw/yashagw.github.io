import RSS from "rss";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
  const feed = new RSS({
    title: siteConfig.title,
    description: siteConfig.description,
    site_url: siteConfig.baseUrl,
    feed_url: `${siteConfig.baseUrl}/rss.xml`,
    language: "en",
    pubDate: new Date(),
  });

  const posts = getAllPosts();

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.description || "",
      url: `${siteConfig.baseUrl}/blog/${post.slug}/`,
      date: new Date(post.date),
      categories: post.tags,
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
