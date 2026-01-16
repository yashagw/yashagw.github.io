import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getAllPostSlugs, getPostBySlug, slugifyTag } from "@/lib/posts";
import { CodeBlock, Callout } from "@/components/mdx";
import type { Metadata } from "next";

// Custom MDX components for interactive blog posts
const mdxComponents = {
  CodeBlock,
  Callout,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { frontmatter, content } = post;

  return (
    <article className="blog-post">
      <header className="post-header">
        <h1 className="post-title">{frontmatter.title}</h1>
        <div className="blog-meta">
          <time dateTime={frontmatter.date}>{formatDate(frontmatter.date)}</time>
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="tag-list">
              {frontmatter.tags.map((tag) => (
                <Link key={tag} href={`/tags/${slugifyTag(tag)}/`} className="tag">
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="blog-content">
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight, rehypeSlug],
            },
          }}
        />
      </div>
    </article>
  );
}
