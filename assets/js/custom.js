document.documentElement.classList.add('js-ready');

document.addEventListener('DOMContentLoaded', () => {
  const revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const interactiveCards = document.querySelectorAll('.signal-post-card, .signal-hero__body, .signal-hero__panel');

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--cursor-x', `${x}%`);
      card.style.setProperty('--cursor-y', `${y}%`);
    });
  });

  const filterRoot = document.querySelector('[data-post-filter]');

  if (!filterRoot) {
    return;
  }

  const buttons = Array.from(filterRoot.querySelectorAll('[data-filter]'));
  const items = Array.from(document.querySelectorAll('[data-post-filter-item]'));
  const status = filterRoot.querySelector('[data-filter-status]');

  const applyFilter = (button) => {
    const token = button.dataset.filter;
    const label = button.dataset.filterLabel || button.textContent.trim();
    let visible = 0;

    items.forEach((item) => {
      const categories = (item.dataset.categories || '').split(/\s+/).filter(Boolean);
      const tags = (item.dataset.tags || '').split(/\s+/).filter(Boolean);
      const match = token === 'all' || categories.includes(token) || tags.includes(token);

      item.classList.toggle('d-none', !match);

      if (match) {
        visible += 1;
      }
    });

    buttons.forEach((candidate) => {
      candidate.classList.toggle('is-active', candidate === button);
    });

    if (status) {
      status.textContent =
        token === 'all'
          ? `${visible}개의 글을 모두 표시 중입니다.`
          : `${label} 기준 ${visible}개의 글을 표시 중입니다.`;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button));
  });

  const initialButton = buttons.find((button) => button.classList.contains('is-active')) || buttons[0];

  if (initialButton) {
    applyFilter(initialButton);
  }
});
