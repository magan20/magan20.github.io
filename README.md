# SIG//MAGAN

`SIG//MAGAN`은 보안 리서치, 오펜시브 사고, 디펜시브 엔지니어링, 자동화 노트를 기록하는 개인 기술 블로그입니다.

## Stack

- [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) 기반 Jekyll 블로그
- GitHub Actions를 통한 GitHub Pages 배포
- 내장 검색, 카테고리/태그 아카이브, 관련 글, 코드 복사 버튼

## GitHub Pages Setup

이 저장소는 GitHub Pages의 기본 브랜치 빌드가 아니라 커스텀 GitHub Actions 워크플로로 배포합니다.

반드시 저장소의 `Settings > Pages > Build and deployment > Source`를 `GitHub Actions`로 설정해야 합니다.

`Deploy from a branch`로 남아 있으면 GitHub가 자체 `github-pages` 빌더를 실행하고, 이 경우 현재 설정은 다음 오류를 냅니다.

- `The minimal-mistakes-jekyll theme could not be found`
- `The github-pages gem can't satisfy your Gemfile's dependencies`

## Content Structure

- `_posts/`: 공개 글과 리서치 노트
- `_drafts/`: 작업 중인 초안
- `_pages/`: 소개, 블로그, 리서치, 카테고리, 태그 같은 정보 페이지

리서치 노트는 별도 컬렉션 대신 `research-note` 태그를 기준으로 `/research/` 페이지에서 모아 보여줍니다.

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

`Gemfile.lock`은 저장소에 커밋하지 않습니다. 로컬 환경과 GitHub Actions가 각자 맞는 의존성 집합을 해석하도록 두었습니다.

## Authoring Helpers

```bash
bin/new-post "My New Post"
bin/new-research "Short Research Note"
```

초안은 `_drafts/`에 생성되고, 공개 시점에 `_posts/YYYY-MM-DD-slug.md`로 옮기면 됩니다.

## Future Workflow

Markdown이 정본입니다. 이후 Notion 동기화나 별도 글쓰기 UI를 추가하더라도 같은 front matter 스키마를 만들어 PR 기반으로 반영하는 방향을 유지합니다.
