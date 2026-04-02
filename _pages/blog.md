---
title: "Blog"
permalink: /blog/
layout: archive
author_profile: false
classes:
  - wide
---

긴 글과 설계 메모를 모아둔 메인 아카이브입니다. `research-note` 태그가 붙은 짧은 노트는 별도 리서치 페이지에서도 다시 찾을 수 있습니다.

<div class="entries-grid">
  {% for post in site.posts %}
    {% unless post.tags contains 'research-note' %}
      {% include archive-single.html type="grid" %}
    {% endunless %}
  {% endfor %}
</div>
