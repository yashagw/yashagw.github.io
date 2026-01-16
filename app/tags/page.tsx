import Link from "next/link";
import { getAllTags } from "@/lib/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tags",
  description: "Browse all tags",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="blog-container">
      <h1>All Tags</h1>

      <div className="tag-list" style={{ marginTop: "2rem", gap: "1rem" }}>
        {tags.map(({ tag, slug, count }) => (
          <Link
            key={slug}
            href={`/tags/${slug}/`}
            className="tag"
            style={{ padding: "0.5rem 1rem", fontSize: "14px" }}
          >
            {tag} ({count})
          </Link>
        ))}
      </div>
    </div>
  );
}
