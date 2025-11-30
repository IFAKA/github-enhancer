// GitHub Enhancer - Font Controls Module
// Adds font size controls to sidebar
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Add font size controls to sidebar
   */
  function addFontSizeControls() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const sidebar = GH.utils.findSidebar();
    if (!sidebar) return;

    if (document.querySelector('.gh-enhancer-font-controls-row')) return;

    // Load saved font size
    try {
      const saved = localStorage.getItem('gh-enhancer-font-size');
      if (saved) {
        GH.state.currentFontSize = parseInt(saved);
        readme.style.fontSize = `${GH.state.currentFontSize}%`;
      }
    } catch (e) {}

    const row = document.createElement('div');
    row.className = 'BorderGrid-row gh-enhancer-font-controls-row';
    row.innerHTML = `
      <div class="BorderGrid-cell">
        <div class="gh-enhancer-font-controls-label">README Font Size</div>
        <div class="gh-enhancer-font-controls">
          <button class="gh-enhancer-font-btn" data-action="decrease" title="Decrease font size">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.5 8a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3.5 8Z"/>
            </svg>
          </button>
          <span class="gh-enhancer-font-size">${GH.state.currentFontSize}%</span>
          <button class="gh-enhancer-font-btn" data-action="increase" title="Increase font size">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.25 3.5a.75.75 0 0 1 1.5 0V7h3.5a.75.75 0 0 1 0 1.5h-3.5V12a.75.75 0 0 1-1.5 0V8.5H3.75a.75.75 0 0 1 0-1.5h3.5V3.5Z"/>
            </svg>
          </button>
          <button class="gh-enhancer-font-btn" data-action="reset" title="Reset font size">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 1-4.546 2.914.75.75 0 0 0-1.364-.628A6.5 6.5 0 1 0 8 1.5v2A.75.75 0 0 0 8 3Z"/>
              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466Z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const sizeLabel = row.querySelector('.gh-enhancer-font-size');

    row.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      switch (action) {
        case 'increase':
          GH.state.currentFontSize = Math.min(GH.state.currentFontSize + 10, 200);
          break;
        case 'decrease':
          GH.state.currentFontSize = Math.max(GH.state.currentFontSize - 10, 50);
          break;
        case 'reset':
          GH.state.currentFontSize = 100;
          break;
      }

      readme.style.fontSize = `${GH.state.currentFontSize}%`;
      sizeLabel.textContent = `${GH.state.currentFontSize}%`;

      try {
        localStorage.setItem('gh-enhancer-font-size', GH.state.currentFontSize);
      } catch (e) {}
    });

    // Insert after repo actions or at the top
    const repoActions = sidebar.querySelector('.gh-enhancer-repo-actions');
    if (repoActions) {
      repoActions.after(row);
    } else {
      const firstRow = sidebar.querySelector('.BorderGrid-row');
      if (firstRow) {
        sidebar.insertBefore(row, firstRow);
      } else {
        sidebar.appendChild(row);
      }
    }

    // Add keyboard shortcuts for font size (only when lightbox is not open)
    document.addEventListener('keydown', (e) => {
      if (GH.state.lightboxOverlay && GH.state.lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) {
        return;
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        GH.state.currentFontSize = Math.min(GH.state.currentFontSize + 10, 200);
        readme.style.fontSize = `${GH.state.currentFontSize}%`;
        sizeLabel.textContent = `${GH.state.currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', GH.state.currentFontSize); } catch (err) {}
      }

      if (e.key === '-') {
        e.preventDefault();
        GH.state.currentFontSize = Math.max(GH.state.currentFontSize - 10, 50);
        readme.style.fontSize = `${GH.state.currentFontSize}%`;
        sizeLabel.textContent = `${GH.state.currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', GH.state.currentFontSize); } catch (err) {}
      }

      if (e.key === '0') {
        e.preventDefault();
        GH.state.currentFontSize = 100;
        readme.style.fontSize = `${GH.state.currentFontSize}%`;
        sizeLabel.textContent = `${GH.state.currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', GH.state.currentFontSize); } catch (err) {}
      }
    });
  }

  function init() {
    addFontSizeControls();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-font-controls-row').forEach(el => el.remove());
    const readme = GH.utils.findReadme();
    if (readme) readme.style.fontSize = '';
  }

  GH.fontControls = { init, reset };
})();
