---
title: "Web Surface Mapping Before the First Payload"
description: "공격 코드를 보내기 전에 인터페이스와 신뢰 경계를 어떻게 읽고 분류할지에 대한 실전형 메모."
date: 2026-04-02 12:00:00 +0900
lang: en
categories: [Offensive, Web]
tags:
  - web-security
  - notes
  - reconnaissance
series: Surface Mapping
pin: true
image:
  path: /assets/img/posts/web-surface-mapping/cover.svg
  alt: Web surface mapping notebook cover
toc: true
content_id: "post-web-surface-mapping"
origin_id:
last_synced_at:
---
## Start With the Shape, Not the Payload

When a target is new, the fastest way to waste time is to rush into payloads before understanding the interface.
I prefer to map three things first:

1. where user input lands
2. which state transitions are trusted
3. how error handling leaks structure

That first pass often tells me whether the next hour belongs to recon, content-type abuse, auth logic review, or JavaScript reversing.

## A Practical First Pass

- Read every route as a state machine, not as a page.
- Compare authenticated and unauthenticated responses.
- Record every reflected value before testing for exploitability.
- Capture headers, CSP, caching behavior, and CDN fingerprints.

```bash
curl -i https://target.example/app \
  -H 'User-Agent: surface-map/1.0' \
  -H 'Accept: text/html'
```

이 단계의 핵심은 "무엇이 취약한가"를 단정하는 것이 아니라, 어디에 시간과 깊이를 투입해야 하는지를 결정하는 것입니다.

## Signals Worth Keeping

### Trust Boundaries

폼, 쿼리스트링, 로컬 스토리지, 쿠키, 그리고 프론트엔드 상태 관리 레이어가 서로 다른 신뢰 경계를 만들고 있는지 확인합니다.

### Repeated Normalization

입력이 서버와 클라이언트에서 각각 다른 방식으로 정규화되면 우회 가능성이 생깁니다.
특히 파일명, URL, Markdown, HTML sanitization 흐름은 따로 메모해 두는 편이 좋습니다.

### Error Grammar

에러 메시지의 어휘와 형식은 종종 백엔드 프레임워크, 리버스 프록시, 혹은 내부 API의 구조를 암시합니다.

## Notes for Later Expansion

이 블로그는 나중에 Notion이나 별도 작성 UI를 붙이더라도 동일한 Markdown front matter를 유지할 예정입니다.
그래서 포스트 초안 단계에서도 `categories`, `tags`, `series`, `origin`을 빠르게 채우는 습관이 중요합니다.
