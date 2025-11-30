// GitHub Enhancer - Import Linkify Module
// Converts import statements to clickable npm links
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Mark span as npm link target
   */
  function markAsNpmLink(span) {
    const text = span.textContent;
    const match = text.match(/^['"](@?[a-zA-Z0-9][-a-zA-Z0-9._]*(?:\/[a-zA-Z0-9][-a-zA-Z0-9._]*)?)(.*)['"]$/);

    if (match) {
      const fullPath = match[1] + (match[2] || '');
      let packageName = match[1];
      if (!packageName.startsWith('@')) {
        packageName = packageName.split('/')[0];
      }

      let npmUrl = `https://www.npmjs.com/package/${packageName}`;
      if (fullPath !== packageName) {
        npmUrl += `#:~:text=${encodeURIComponent(fullPath)}`;
      }

      span.classList.add('gh-enhancer-npm-target');
      span.dataset.npmPackage = packageName;
      span.dataset.npmUrl = npmUrl;
      span.title = `Ctrl/Cmd + click to view ${packageName} on npm`;
    }
  }

  /**
   * Convert import statements in JS code blocks to clickable npm links (Ctrl/Cmd + click)
   */
  function linkifyImports() {
    const jsCodeBlocks = document.querySelectorAll('.highlight-source-js pre, .highlight-source-ts pre, .highlight-source-tsx pre, .highlight-source-jsx pre');

    jsCodeBlocks.forEach(pre => {
      if (pre.dataset.ghEnhancerImports) return;
      pre.dataset.ghEnhancerImports = 'true';

      const keywords = pre.querySelectorAll('span.pl-k');
      keywords.forEach(keyword => {
        const keywordText = keyword.textContent.trim();

        if (keywordText === 'from') {
          let next = keyword.nextSibling;
          while (next) {
            if (next.nodeType === Node.ELEMENT_NODE && next.classList.contains('pl-s')) {
              markAsNpmLink(next);
              break;
            }
            if (next.nodeType === Node.TEXT_NODE && next.textContent.trim() === '') {
              next = next.nextSibling;
              continue;
            }
            if (next.nodeType === Node.ELEMENT_NODE && !next.classList.contains('pl-s')) {
              break;
            }
            next = next.nextSibling;
          }
        }
      });

      const functionNames = pre.querySelectorAll('span.pl-en');
      functionNames.forEach(fn => {
        if (fn.textContent.trim() === 'require') {
          let next = fn.nextSibling;
          while (next) {
            if (next.nodeType === Node.ELEMENT_NODE && next.classList.contains('pl-s')) {
              markAsNpmLink(next);
              break;
            }
            if (next.nodeType === Node.TEXT_NODE) {
              next = next.nextSibling;
              continue;
            }
            if (next.nodeType === Node.ELEMENT_NODE && !next.classList.contains('pl-s')) {
              break;
            }
            next = next.nextSibling;
          }
        }
      });
    });
  }

  /**
   * Setup global keyboard listeners for Ctrl/Cmd + click on npm links
   */
  function setupNpmLinkHandlers() {
    let isModifierPressed = false;

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        isModifierPressed = true;
        document.body.classList.add('gh-enhancer-ctrl-pressed');
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        isModifierPressed = false;
        document.body.classList.remove('gh-enhancer-ctrl-pressed');
      }
    });

    window.addEventListener('blur', () => {
      isModifierPressed = false;
      document.body.classList.remove('gh-enhancer-ctrl-pressed');
    });

    document.addEventListener('click', (e) => {
      if (!isModifierPressed) return;

      const target = e.target.closest('.gh-enhancer-npm-target');
      if (target && target.dataset.npmUrl) {
        e.preventDefault();
        e.stopPropagation();
        window.open(target.dataset.npmUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  function init() {
    linkifyImports();
  }

  function reset() {
    // npm link targets are cleaned up when code blocks are removed
  }

  // Setup handlers once on load
  setupNpmLinkHandlers();

  GH.importLinkify = { init, reset };
})();
