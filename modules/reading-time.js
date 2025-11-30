// GitHub Enhancer - Reading Time Module
// Adds estimated reading time to sidebar
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Add estimated reading time to sidebar
   */
  function addReadingTime() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const sidebar = GH.utils.findSidebar();
    if (!sidebar) return;

    if (document.querySelector('.gh-enhancer-reading-time-row')) return;

    // Calculate reading time (average 200 words per minute)
    const text = readme.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const row = document.createElement('div');
    row.className = 'BorderGrid-row gh-enhancer-reading-time-row';
    row.innerHTML = `
      <div class="BorderGrid-cell">
        <div class="gh-enhancer-reading-time">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
          </svg>
          <span>~${readingTime} min read</span>
          <span class="gh-enhancer-word-count">(${wordCount.toLocaleString()} words)</span>
        </div>
      </div>
    `;

    // Insert after font controls or repo actions
    const fontControls = sidebar.querySelector('.gh-enhancer-font-controls-row');
    const repoActions = sidebar.querySelector('.gh-enhancer-repo-actions');
    if (fontControls) {
      fontControls.after(row);
    } else if (repoActions) {
      repoActions.after(row);
    } else {
      const firstRow = sidebar.querySelector('.BorderGrid-row');
      if (firstRow) {
        sidebar.insertBefore(row, firstRow);
      } else {
        sidebar.appendChild(row);
      }
    }
  }

  function init() {
    addReadingTime();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-reading-time-row').forEach(el => el.remove());
  }

  GH.readingTime = { init, reset };
})();
