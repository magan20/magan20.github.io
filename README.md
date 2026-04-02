# SIG//MAGAN

`SIG//MAGAN`은 Chirpy 기반으로 운영되는 보안·오펜시브·디펜시브·엔지니어링 블로그입니다.

## Stack

- [Chirpy Starter](https://github.com/cotes2020/chirpy-starter) 기반 구조
- [jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 테마
- GitHub Actions를 통한 GitHub Pages 배포
- 내장 검색, 다크 모드 토글, TOC, 태그/카테고리 아카이브, PWA

## Local Development

Chirpy `7.5.x`는 공식 gemspec 기준 Ruby `~> 3.1` 이상을 요구합니다. 현재 배포 워크플로는 Ruby `3.4`로 동작합니다.

```bash
bundle install
bundle exec jekyll s
```

## Content Model

- `_posts/`: 공개 포스트와 리서치 노트
- `_drafts/`: 발행 전 초안
- `_tabs/`: Research, Categories, Tags, Archives, About 탭

리서치 노트는 별도 컬렉션 대신 `research-note` 태그를 기준으로 `/research/` 탭에서 다시 모아 보여줍니다.

## Authoring Helpers

```bash
bin/new-post "My New Post"
bin/new-research "Short Research Note"
```

초안은 `_drafts/`에 생성되고, 공개 시점에 `_posts/YYYY-MM-DD-slug.md`로 옮기면 됩니다.
