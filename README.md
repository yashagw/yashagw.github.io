# Personal Website & Blog

A modern, responsive personal website and blog built with [Next.js](https://nextjs.org/). Features a clean design, blog functionality with MDX support, and automated GitHub Pages deployment.

## Live Site

[https://yashagw.github.io/](https://yashagw.github.io/)

## Quick Start Guide

### 1. Clone and Setup

```bash
git clone https://github.com/yashagw/yashagw.github.io.git
cd yashagw.github.io
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
# Visit http://localhost:3000
```

### 4. Add Blog Posts

Create new posts in `content/blog/` as Markdown files:

```markdown
+++
title = "Your Blog Post Title"
date = 2024-01-15
taxonomies = { tags = ["tag1", "tag2"] }
+++

Your content here...
```

### 5. Build for Production

```bash
npm run build
```

## Deployment

1. **Fork this repository** and rename to `yourusername.github.io`
2. **Enable GitHub Pages** in repository settings → Pages → Source: "GitHub Actions"
3. **Push to main branch** - the included workflow will auto-deploy

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `content/blog/` - Blog posts (Markdown)
- `lib/` - Utility functions
- `public/` - Static assets (images, icons)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Fork and use as a template for your own site!
