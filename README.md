# Personal Website & Blog

A modern, responsive personal website and blog built with [Zola](https://www.getzola.org/). Features a clean design, blog functionality, and automated GitHub Pages deployment.

## 🚀 Live Site

[https://yashagw.github.io/](https://yashagw.github.io/)

## 🛠️ Quick Start Guide

### 1. Clone and Setup

```bash
git clone https://github.com/yashagw/yashagw.github.io.git
cd yashagw.github.io
```

### 2. Install Zola

**macOS:**
```bash
brew install zola
```

**Linux/Windows:** See [Zola installation guide](https://www.getzola.org/documentation/getting-started/installation/)

### 3. Customize Your Site

Edit `config.toml` to personalize:
- Site title, description, and URL
- Personal information and contact details
- Work experience and education
- Skills and technologies

Replace `static/images/profile.jpg` with your own photo.

### 4. Add Blog Posts

Create new posts in `content/blog/`:

```markdown
+++
title = "Your Blog Post Title"
date = 2024-01-15
tags = ["tag1", "tag2"]
+++

Your content here...
```

### 5. Test Locally

```bash
zola serve
# Visit http://127.0.0.1:1111
```

## 🚀 Deployment

1. **Fork this repository** and rename to `yourusername.github.io`
2. **Enable GitHub Pages** in repository settings → Pages → Source: "GitHub Actions"
3. **Push to main branch** - the included workflow will auto-deploy

## 📁 Structure

- `config.toml` - Site configuration (play around here!)
- `content/blog/` - Blog posts
- `static/` - Images, CSS, icons
- `templates/` - HTML templates

## 🤝 Contributing

Fork and use as a template for your own site!
