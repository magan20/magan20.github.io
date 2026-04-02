---
title: "Packet Triage Template for Short-Lived Incidents"
description: "짧은 시간 안에 네트워크 이벤트를 분류할 때 사용하는 간단한 트리아지 체크리스트."
date: 2026-03-20 22:10:00 +0900
categories: [Defensive, Operations]
tags:
  - threat-hunting
  - notes
  - research-note
image:
  path: /assets/img/posts/packet-triage/cover.svg
  alt: Packet triage worksheet cover
toc: true
content_id: "research-packet-triage-template"
origin: manual
origin_id:
last_synced_at:
---
## Goal

짧은 인시던트 대응 시간에서는 "정확한 전체 분석"보다 "다음 판단을 위한 충분한 분류"가 더 중요합니다.

## Fast Questions

- 출발지와 목적지의 평소 패턴인가
- 프로토콜 선택이 자산의 역할과 맞는가
- TLS, DNS, HTTP의 메타데이터 중 이상한 축이 있는가
- 동일한 시점의 인증/프로세스 이벤트와 상관관계가 있는가

## Minimal Worksheet

```text
asset_role:
source:
destination:
protocol:
expected?:
related_process:
related_identity:
confidence:
next_action:
```

## Usage

이 노트는 긴 글이 되기 전 단계의 리서치 메모를 위한 템플릿입니다. 이후 확장 시 Notion 초안을 가져오더라도 같은 메타 구조로 Markdown에 안착시키는 것을 목표로 합니다.
