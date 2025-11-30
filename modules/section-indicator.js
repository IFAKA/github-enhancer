// GitHub Enhancer - Section Indicator Module
// Adds current section indicator to the navigation tabs
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Simple scroll-based section tracking
   */
  function setupScrollTracking(sectionLi) {
    const textSpan = sectionLi.querySelector('.gh-enhancer-section-text');
    const link = sectionLi.querySelector('a');
    let lastSectionIndex = -1;

    const updateCurrentSection = () => {
      const headings = document.querySelectorAll('.markdown-body .markdown-heading');
      if (headings.length === 0) return;

      let currentIndex = -1;
      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top < 100) {
          currentIndex = i;
        } else {
          break;
        }
      }

      if (currentIndex === -1) {
        sectionLi.style.display = 'none';
        GH.state.currentSectionElement = null;
        lastSectionIndex = -1;
        return;
      }

      if (currentIndex === lastSectionIndex) return;

      const heading = headings[currentIndex];
      const headingEl = heading.querySelector('.heading-element') || heading.querySelector('h1, h2, h3, h4, h5, h6');
      if (!headingEl) return;

      const sectionName = headingEl.textContent.trim();
      GH.state.currentSectionElement = headingEl;

      const direction = currentIndex > lastSectionIndex ? 'down' : 'up';
      lastSectionIndex = currentIndex;

      sectionLi.style.display = '';
      textSpan.classList.remove('gh-enhancer-slide-up', 'gh-enhancer-slide-down');
      void textSpan.offsetWidth; // Force reflow
      textSpan.classList.add(direction === 'down' ? 'gh-enhancer-slide-down' : 'gh-enhancer-slide-up');
      textSpan.textContent = sectionName;

      const anchor = heading.querySelector('a.anchor');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href) link.href = href;
      }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateCurrentSection();
          ticking = false;
        });
        ticking = true;
      }
    });

    updateCurrentSection();
  }

  /**
   * Add current section indicator to the navigation tabs
   */
  function addSectionIndicator() {
    const navList = document.querySelector('ul.prc-components-UnderlineItemList-b23Hf[role="list"]');
    if (!navList || navList.querySelector('.gh-enhancer-section-indicator')) return;

    const sectionLi = document.createElement('li');
    sectionLi.className = 'prc-UnderlineNav-UnderlineNavItem--xDk1 gh-enhancer-section-indicator';
    sectionLi.style.display = 'none';

    sectionLi.innerHTML = `
      <a href="#" class="prc-components-UnderlineItem-lJsg- gh-enhancer-section-link">
        <span data-component="icon">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-list-unordered" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="vertical-align:text-bottom">
            <path d="M5.75 2.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
          </svg>
        </span>
        <span class="gh-enhancer-section-text-wrapper">
          <span class="gh-enhancer-section-text" data-component="text"></span>
        </span>
      </a>
    `;

    navList.appendChild(sectionLi);

    sectionLi.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      if (GH.state.currentSectionElement) {
        GH.state.currentSectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    });

    setupScrollTracking(sectionLi);
  }

  function init() {
    addSectionIndicator();
  }

  function reset() {
    GH.state.currentSectionElement = null;
    document.querySelectorAll('.gh-enhancer-section-indicator').forEach(el => el.remove());
  }

  GH.sectionIndicator = { init, reset };
})();
