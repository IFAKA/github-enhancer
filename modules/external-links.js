// GitHub Enhancer - External Links Module
// Adds external link indicators
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Add external link indicators
   */
  function addExternalLinkIndicators() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const currentHost = window.location.hostname;
    const links = readme.querySelectorAll('a[href^="http"]');

    links.forEach(link => {
      if (link.dataset.ghEnhancerExternal) return;
      link.dataset.ghEnhancerExternal = 'true';

      try {
        const url = new URL(link.href);
        if (url.hostname !== currentHost && !url.hostname.includes('github.com')) {
          link.classList.add('gh-enhancer-external-link');
          const icon = document.createElement('span');
          icon.className = 'gh-enhancer-external-icon';
          icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"/>
          </svg>`;
          link.appendChild(icon);
        }
      } catch (e) {}
    });
  }

  function init() {
    addExternalLinkIndicators();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-external-icon').forEach(el => el.remove());
  }

  GH.externalLinks = { init, reset };
})();
