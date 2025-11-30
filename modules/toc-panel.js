// GitHub Enhancer - TOC Panel Module
// Creates Table of Contents sidebar panel
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Setup scroll tracking for TOC highlighting
   */
  function setupTOCScrollTracking(headings, nav) {
    const links = nav.querySelectorAll('.gh-enhancer-toc-link');

    const updateActiveLink = () => {
      let currentIndex = -1;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top < 120) {
          currentIndex = i;
        } else {
          break;
        }
      }

      links.forEach((link, i) => {
        link.classList.toggle('gh-enhancer-toc-active', i === currentIndex);
      });

      if (currentIndex >= 0 && links[currentIndex]) {
        links[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    });

    updateActiveLink();
  }

  /**
   * Show TOC toggle button when panel is hidden
   */
  function showTOCToggle() {
    let toggle = document.querySelector('.gh-enhancer-toc-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'gh-enhancer-toc-toggle';
      toggle.setAttribute('aria-label', 'Show Table of Contents');
      toggle.setAttribute('title', 'Show Table of Contents');
      toggle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3.75-1.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM3 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
        </svg>
      `;
      toggle.addEventListener('click', () => {
        if (GH.state.tocPanel) {
          GH.state.tocPanel.classList.remove('gh-enhancer-toc-hidden');
          toggle.style.display = 'none';
          try {
            localStorage.setItem('gh-enhancer-toc-hidden', 'false');
          } catch (e) {}
        }
      });
      document.body.appendChild(toggle);
    }
    toggle.style.display = 'flex';
    try {
      localStorage.setItem('gh-enhancer-toc-hidden', 'true');
    } catch (e) {}
  }

  /**
   * Create Table of Contents sidebar panel
   */
  function createTOCPanel() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    if (GH.state.tocPanel) GH.state.tocPanel.remove();

    const headings = readme.querySelectorAll('.markdown-heading');
    if (headings.length < 3) return;

    GH.state.tocPanel = document.createElement('div');
    GH.state.tocPanel.className = 'gh-enhancer-toc-panel';
    GH.state.tocPanel.innerHTML = `
      <div class="gh-enhancer-toc-header">
        <span>Contents</span>
        <button class="gh-enhancer-toc-close" aria-label="Close TOC">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
          </svg>
        </button>
      </div>
      <nav class="gh-enhancer-toc-nav"></nav>
    `;

    const nav = GH.state.tocPanel.querySelector('.gh-enhancer-toc-nav');

    headings.forEach((heading, index) => {
      const headingEl = heading.querySelector('h1, h2, h3, h4, h5, h6');
      if (!headingEl) return;

      const level = parseInt(headingEl.tagName[1]);
      const text = headingEl.textContent.trim();
      const anchor = heading.querySelector('a.anchor');
      const href = anchor ? anchor.getAttribute('href') : `#heading-${index}`;

      const link = document.createElement('a');
      link.className = `gh-enhancer-toc-link gh-enhancer-toc-level-${level}`;
      link.href = href;
      link.textContent = text;
      link.dataset.headingIndex = index;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        headingEl.scrollIntoView({ behavior: 'smooth' });
      });

      nav.appendChild(link);
    });

    GH.state.tocPanel.querySelector('.gh-enhancer-toc-close').addEventListener('click', () => {
      GH.state.tocPanel.classList.add('gh-enhancer-toc-hidden');
      showTOCToggle();
    });

    document.body.appendChild(GH.state.tocPanel);

    setupTOCScrollTracking(headings, nav);

    try {
      if (localStorage.getItem('gh-enhancer-toc-hidden') === 'true') {
        GH.state.tocPanel.classList.add('gh-enhancer-toc-hidden');
        showTOCToggle();
      }
    } catch (e) {}
  }

  function init() {
    createTOCPanel();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-toc-panel').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-toc-toggle').forEach(el => el.remove());
    GH.state.tocPanel = null;
  }

  GH.tocPanel = { init, reset };
})();
