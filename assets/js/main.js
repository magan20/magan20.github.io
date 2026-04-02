const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

document.documentElement.classList.add("js-ready");

const body = document.body;
const baseurl = body.dataset.baseurl || "";

const setupReadingProgress = () => {
  const progressBar = document.querySelector("[data-progress-bar]");
  if (!progressBar) return;

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio))}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
};

const setupTOC = () => {
  const content = document.querySelector("[data-post-content]");
  const toc = document.querySelector("[data-toc-list]");
  if (!content || !toc) return;

  const headings = [...content.querySelectorAll("h2, h3")];
  if (!headings.length) {
    toc.parentElement?.classList.add("is-hidden");
    return;
  }

  const seen = new Map();
  headings.forEach((heading) => {
    if (!heading.id) {
      const base = slugify(heading.textContent || "section") || "section";
      const nextCount = (seen.get(base) || 0) + 1;
      seen.set(base, nextCount);
      heading.id = nextCount === 1 ? base : `${base}-${nextCount}`;
    }
  });

  toc.innerHTML = headings
    .map(
      (heading) =>
        `<a href="#${heading.id}" data-toc-link class="${heading.tagName === "H3" ? "toc-child" : ""}">${escapeHtml(
          heading.textContent || ""
        )}</a>`
    )
    .join("");

  const links = [...toc.querySelectorAll("[data-toc-link]")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = toc.querySelector(`a[href="#${entry.target.id}"]`);
        if (link && entry.isIntersecting) {
          links.forEach((item) => item.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "0px 0px -70% 0px", threshold: 0.1 }
  );

  headings.forEach((heading) => observer.observe(heading));
};

const setupCodeCopy = () => {
  document.querySelectorAll("[data-post-content] pre").forEach((block) => {
    if (block.querySelector(".copy-button")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      const text = block.querySelector("code")?.innerText || block.innerText;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
        button.classList.add("is-done");
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("is-done");
        }, 1400);
      } catch (_error) {
        button.textContent = "Failed";
      }
    });
    block.appendChild(button);
  });
};

const setupHeaderSearch = () => {
  const root = document.querySelector("[data-header-search-root]");
  const input = root?.querySelector("[data-header-search-input]");
  const panel = root?.querySelector("[data-header-search-panel]");
  const results = root?.querySelector("[data-header-search-results]");
  const meta = root?.querySelector("[data-header-search-meta]");
  if (!root || !input || !panel || !results || !meta) return;

  let loadedIndex = null;

  const fetchIndex = async () => {
    if (loadedIndex) return loadedIndex;
    try {
      const response = await fetch(`${baseurl}/search.json`);
      loadedIndex = await response.json();
      return loadedIndex;
    } catch (_error) {
      loadedIndex = [];
      return loadedIndex;
    }
  };

  const setMeta = (query, count) => {
    if (!query.trim()) {
      meta.innerHTML = "<span>Recent</span><span>latest published entries</span>";
      return;
    }

    meta.innerHTML = `<span>Results</span><span>${count} match${count === 1 ? "" : "es"} for "${escapeHtml(query)}"</span>`;
  };

  const renderResults = (items, query = "") => {
    const visibleItems = items.slice(0, 8);
    setMeta(query, items.length);

    if (!visibleItems.length) {
      results.innerHTML = '<p class="muted">검색 결과가 없습니다.</p>';
      return;
    }

    results.innerHTML = visibleItems
      .map(
        (item) => `
          <a class="search-result" href="${escapeHtml(item.url)}">
            <div class="search-result-head">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.type)} / ${escapeHtml(item.lang.toUpperCase())}</small>
            </div>
            <p>${escapeHtml(item.description || item.excerpt || "")}</p>
            <small>${escapeHtml(item.categories.join(", "))} · ${escapeHtml(item.tags.join(", "))}</small>
          </a>
        `
      )
      .join("");
  };

  const open = () => {
    panel.hidden = false;
    root.classList.add("is-open");
  };

  const close = () => {
    panel.hidden = true;
    root.classList.remove("is-open");
  };

  const searchItems = async () => {
    const index = await fetchIndex();
    const query = input.value.trim().toLowerCase();

    if (!query) {
      renderResults(index, "");
      open();
      return;
    }

    const tokens = query.split(/\s+/).filter(Boolean);
    const matches = index
      .map((item) => {
        const haystack = [
          item.title,
          item.description,
          item.excerpt,
          item.type,
          ...(item.categories || []),
          ...(item.tags || []),
          item.series || "",
        ]
          .join(" ")
          .toLowerCase();

        const score = tokens.reduce((total, token) => {
          if (item.title.toLowerCase().includes(token)) return total + 5;
          if ((item.tags || []).join(" ").toLowerCase().includes(token)) return total + 4;
          if ((item.categories || []).join(" ").toLowerCase().includes(token)) return total + 3;
          if (haystack.includes(token)) return total + 1;
          return total;
        }, 0);

        return { item, score, haystack };
      })
      .filter(({ score, haystack }) => score > 0 && tokens.every((token) => haystack.includes(token)))
      .sort((left, right) => right.score - left.score || new Date(right.item.date) - new Date(left.item.date))
      .map(({ item }) => item);

    renderResults(matches, query);
    open();
  };

  const focusSearch = async () => {
    await fetchIndex();
    if (!input.value.trim()) {
      renderResults(loadedIndex || [], "");
    }
    open();
    input.focus();
  };

  input.addEventListener("focus", focusSearch);
  input.addEventListener("input", searchItems);

  results.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      close();
    }
  });

  document.querySelectorAll("[data-focus-search]").forEach((button) => {
    button.addEventListener("click", focusSearch);
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) return;
    if (!root.contains(event.target)) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isField =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !isField) {
      event.preventDefault();
      focusSearch();
    }

    if (event.key === "Escape" && root.classList.contains("is-open")) {
      close();
      input.blur();
    }
  });
};

const setupListingFilters = () => {
  document.querySelectorAll("[data-filter-root]").forEach((root) => {
    const searchInput = root.querySelector("[data-filter-search]");
    const sortSelect = root.querySelector("[data-filter-sort]");
    const grid = root.querySelector("[data-filter-grid]");
    const emptyState = root.querySelector("[data-filter-empty]");
    const countNode = document.querySelector("[data-filter-count]");
    const items = [...root.querySelectorAll("[data-filter-item]")];

    const selected = {
      categories: new Set(),
      tags: new Set(),
    };

    const apply = () => {
      const query = (searchInput?.value || "").trim().toLowerCase();
      const tokens = query.split(/\s+/).filter(Boolean);

      const sorted = items.sort((left, right) => {
        if (!sortSelect) return 0;
        if (sortSelect.value === "oldest") {
          return Number(left.dataset.date) - Number(right.dataset.date);
        }
        if (sortSelect.value === "title") {
          return (left.dataset.title || "").localeCompare(right.dataset.title || "");
        }
        return Number(right.dataset.date) - Number(left.dataset.date);
      });

      sorted.forEach((item) => grid?.appendChild(item));

      let visibleCount = 0;

      items.forEach((item) => {
        const haystack = [
          item.dataset.title,
          item.dataset.description,
          item.dataset.tags,
          item.dataset.categories,
          item.dataset.series,
        ]
          .join(" ")
          .toLowerCase();

        const categoryMatch =
          !selected.categories.size ||
          [...selected.categories].some((value) => (item.dataset.categories || "").split(" ").includes(value));
        const tagMatch =
          !selected.tags.size ||
          [...selected.tags].some((value) => (item.dataset.tags || "").split(" ").includes(value));
        const queryMatch = !tokens.length || tokens.every((token) => haystack.includes(token));

        const visible = categoryMatch && tagMatch && queryMatch;
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (countNode) countNode.textContent = String(visibleCount);
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };

    root.querySelectorAll("[data-filter-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const group = chip.getAttribute("data-filter-group");
        const value = chip.getAttribute("data-filter-value");
        if (!group || !value) return;

        const bucket = selected[group];
        if (!bucket) return;

        if (bucket.has(value)) {
          bucket.delete(value);
          chip.classList.remove("is-active");
          chip.setAttribute("aria-pressed", "false");
        } else {
          bucket.add(value);
          chip.classList.add("is-active");
          chip.setAttribute("aria-pressed", "true");
        }

        apply();
      });
    });

    searchInput?.addEventListener("input", apply);
    sortSelect?.addEventListener("change", apply);
    apply();
  });
};

setupReadingProgress();
setupTOC();
setupCodeCopy();
setupHeaderSearch();
setupListingFilters();
