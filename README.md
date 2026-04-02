# SIG//MAGAN

Security research, offensive notes, defensive engineering, and technical field reports for `https://magan20.github.io`.

## Stack

- Jekyll with custom layouts
- GitHub Actions deployment to GitHub Pages
- Client-side search, taxonomy filters, TOC, and code-copy interactions

## Content Model

- `_posts/`: long-form blog posts
- `_research/`: shorter research notes
- `_drafts/`: working drafts that must not be published

All published content uses a shared front matter schema:

```yaml
title:
description:
date:
slug:
lang:
status:
categories:
tags:
series:
featured:
toc:
origin:
content_id:
origin_id:
last_synced_at:
```

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

## Authoring Helpers

```bash
bin/new-post "My New Post"
bin/new-research "Short Research Note"
```

`bin/new-post` and `bin/new-research` both create draft templates in `_drafts/`.

## Publishing Flow

1. Create a draft in `_drafts/`
2. Fill in categories and tags
3. Move the file to `_posts/YYYY-MM-DD-slug.md` or `_research/slug.md`
4. Set `status: published`
5. Push to `main` to deploy through GitHub Actions

## Extensibility

Markdown is the source of truth. Future Notion sync or browser-based authoring can generate the same Markdown/front matter shape and submit it through PRs without changing the site renderer.
