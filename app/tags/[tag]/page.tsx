import Link from "next/link";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(({ slug }) => ({ tag: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tags = getAllTags();
  const tagData = tags.find((t) => t.slug === tagSlug);
  const displayName = tagData?.tag || tagSlug;

  return {
    title: `Posts tagged with "${displayName}"`,
    description: `All posts tagged with ${displayName}`,
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function TagPage({ params }: Props) {
  const { tag: tagSlug } = await params;
  const posts = getPostsByTag(tagSlug);
  const tags = getAllTags();
  const tagData = tags.find((t) => t.slug === tagSlug);
  const displayName = tagData?.tag || tagSlug;

  return (
    <div className="blog-container">
      <h1>Posts tagged with &quot;{displayName}&quot;</h1>

      <div className="post-list">
        {posts.map((post) => (
          <div key={post.slug} className="post-item">
            <span className="post-date">{formatDate(post.date)}</span>
            <Link href={`/blog/${post.slug}/`} className="post-title">
              {post.title}
            </Link>
          </div>
        ))}
      </div>

      <Link href="/tags/" style={{ marginTop: "2rem", display: "inline-block" }}>
        &larr; All Tags
      </Link>
    </div>
  );
}
