---
title: "Detection Pipelines Need Product Thinking"
description: "탐지 엔지니어링은 룰 작성이 아니라 신호 제품을 설계하는 일에 가깝습니다."
date: 2026-03-28 09:30:00 +0900
categories: [Defensive, Engineering]
tags:
  - detection-engineering
  - threat-hunting
  - automation
series: Detection Systems
image:
  path: /assets/img/posts/detection-pipeline/cover.svg
  alt: Detection pipeline blueprint cover
toc: true
content_id: "post-detection-pipeline-design"
origin_id:
last_synced_at:
---
## 룰보다 앞에 와야 하는 질문

탐지 로직을 만들 때 많은 팀이 바로 쿼리 문법으로 들어갑니다. 하지만 실제로 오래 가는 탐지는 대개 "이 신호를 누가 소비하는가"를 먼저 정리한 뒤에 나옵니다.

운영 관점에서 먼저 확인해야 할 것은 아래 세 가지입니다.

1. 이 신호가 어떤 의사결정을 트리거하는가
2. 오탐을 감당할 주체가 누구인가
3. 누락됐을 때의 비용이 얼마나 큰가

## Pipeline as a Product

탐지 파이프라인을 하나의 제품처럼 보면 설계가 달라집니다.

- 입력: 어떤 로그와 어떤 컨텍스트가 필요한가
- 처리: 정규화, enrich, correlation, suppression은 어떻게 나뉘는가
- 출력: 분석가가 읽을 수 있는 형태인가, 아니면 기계만 이해할 수 있는가

## Version Everything

탐지 규칙만 버전 관리하는 것으로는 부족합니다. 아래 요소도 함께 관리해야 회귀를 줄일 수 있습니다.

- 필드 매핑 규칙
- 예외 처리 로직
- 플레이북 링크
- 테스트 샘플 이벤트

```yaml
rule_id: sigma-magan-001
status: stable
confidence: medium
owner: detection-team
```

## Why This Matters for the Blog

이 사이트는 카테고리와 태그를 강하게 쓰는 구조이기 때문에, `defensive`와 `engineering`이 같이 걸리는 글도 자연스럽게 아카이빙됩니다.
향후 Notion 연동이 생겨도 같은 분류 체계를 유지하면 검색과 추천 정확도를 쉽게 높일 수 있습니다.
