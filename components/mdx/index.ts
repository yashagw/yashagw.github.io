// MDX Components Registry
// Add your custom interactive components here

export { default as CodeBlock } from "./CodeBlock";
export { default as Callout } from "./Callout";

// Example usage in MDX files:
//
// Pure Markdown posts (existing workflow):
// ```mdx
// ---
// title: "Database Recovery"
// date: 2025-12-23
// tags: ["databases", "recovery"]
// ---
//
// # Regular markdown content here...
// ```
//
// Interactive posts (new capability):
// ```mdx
// ---
// title: "Interactive B-Tree Guide"
// date: 2025-01-15
// tags: ["databases", "interactive"]
// ---
//
// import { Callout } from '@/components/mdx';
//
// # Understanding B-Trees
//
// <Callout type="tip" title="Pro tip">
//   This is an interactive callout!
// </Callout>
// ```
