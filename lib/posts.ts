import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/blog");

// Convert tag to URL-safe slug
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export interface PostFrontmatter {
  title: string;
  date: string;
  tags?: string[];
  description?: string;
  hidden?: boolean;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description?: string;
  hidden?: boolean;
}

function parseTomlFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  // Handle TOML frontmatter (+++...+++)
  const tomlMatch = content.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n([\s\S]*)$/);
  if (tomlMatch) {
    const tomlContent = tomlMatch[1];
    const bodyContent = tomlMatch[2];

    const data: Record<string, unknown> = {};

    // Parse simple TOML key-value pairs
    const lines = tomlContent.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) continue;

      // Handle taxonomies = { tags = [...] }
      const taxonomyMatch = trimmedLine.match(/^taxonomies\s*=\s*\{\s*tags\s*=\s*\[(.*)\]\s*\}$/);
      if (taxonomyMatch) {
        const tagsStr = taxonomyMatch[1];
        data.tags = tagsStr.split(",").map((t) => t.trim().replace(/^["']|["']$/g, ""));
        continue;
      }

      // Handle tags = [...]
      const tagsMatch = trimmedLine.match(/^tags\s*=\s*\[(.*)\]$/);
      if (tagsMatch) {
        const tagsStr = tagsMatch[1];
        data.tags = tagsStr.split(",").map((t) => t.trim().replace(/^["']|["']$/g, ""));
        continue;
      }

      // Handle key = value
      const kvMatch = trimmedLine.match(/^(\w+)\s*=\s*(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1];
        const rawValue = kvMatch[2].trim();

        // Parse booleans
        if (rawValue === "true") {
          data[key] = true;
          continue;
        }
        if (rawValue === "false") {
          data[key] = false;
          continue;
        }

        // Remove quotes for strings
        let value: string = rawValue;
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        data[key] = value;
      }
    }

    return { data, content: bodyContent };
  }

  // Fallback to YAML frontmatter using gray-matter
  return matter(content);
}

export function getAllPosts(includeHidden = false): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((fileName) => {
      // Filter out _index.md and only include .md or .mdx files
      return (
        (fileName.endsWith(".md") || fileName.endsWith(".mdx")) &&
        fileName !== "_index.md"
      );
    })
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = parseTomlFrontmatter(fileContents);

      return {
        slug,
        title: data.title as string,
        date: data.date as string,
        tags: (data.tags as string[]) || [],
        description: data.description as string | undefined,
        hidden: data.hidden as boolean | undefined,
      };
    })
    .filter((post) => includeHidden || !post.hidden)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  // Try both .md and .mdx extensions
  const extensions = [".mdx", ".md"];

  for (const ext of extensions) {
    const fullPath = path.join(postsDirectory, `${slug}${ext}`);

    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = parseTomlFrontmatter(fileContents);

      return {
        slug,
        frontmatter: {
          title: data.title as string,
          date: data.date as string,
          tags: (data.tags as string[]) || [],
          description: data.description as string | undefined,
          hidden: data.hidden as boolean | undefined,
        },
        content,
      };
    }
  }

  return null;
}

export function getAllTags(): { tag: string; slug: string; count: number }[] {
  const posts = getAllPosts();
  const tagData = new Map<string, { name: string; count: number }>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const slug = slugifyTag(tag);
      const existing = tagData.get(slug);
      if (existing) {
        existing.count++;
      } else {
        tagData.set(slug, { name: tag, count: 1 });
      }
    });
  });

  return Array.from(tagData.entries())
    .map(([slug, { name, count }]) => ({ tag: name, slug, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tagSlug: string): PostMeta[] {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => slugifyTag(t) === tagSlug)
  );
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => {
      return (
        (fileName.endsWith(".md") || fileName.endsWith(".mdx")) &&
        fileName !== "_index.md"
      );
    })
    .map((fileName) => fileName.replace(/\.mdx?$/, ""));
}
