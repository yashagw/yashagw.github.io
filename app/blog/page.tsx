import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts, tutorials, and experiences in software engineering and technology.",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="blog-container">
      <h1>Blog</h1>
      <p>Here you&apos;ll find my thoughts, tutorials, and experiences in software engineering and technology.</p>

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
    </div>
  );
}
