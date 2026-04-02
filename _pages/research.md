---
title: "Research"
permalink: /research/
layout: archive
author_profile: false
classes:
  - wide
---

짧은 리서치 노트, 실험 로그, 인시던트 대응용 체크리스트를 모아둔 페이지입니다. 장문 글로 자라기 전의 생각과 관찰을 빠르게 남기는 공간으로 사용합니다.

<div class="entries-grid">
  {% for post in site.posts %}
    {% if post.tags contains 'research-note' %}
      {% include archive-single.html type="grid" %}
    {% endif %}
  {% endfor %}
</div>
