// GitHub Enhancer - Code Collapse Module
// Collapses tall code blocks
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Collapse tall code blocks
   */
  function collapseCodeBlocks() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const codeBlocks = readme.querySelectorAll('.highlight');
    const maxHeight = Math.floor(window.innerHeight * 0.4);

    codeBlocks.forEach(block => {
      if (block.dataset.ghEnhancerCollapse) return;
      block.dataset.ghEnhancerCollapse = 'true';

      const pre = block.querySelector('pre');
      if (!pre) return;

      requestAnimationFrame(() => {
        const actualHeight = pre.scrollHeight;
        if (actualHeight <= maxHeight) return;

        const lineHeight = 20;
        const totalLines = Math.round(actualHeight / lineHeight);
        const visibleLines = Math.round(maxHeight / lineHeight);
        const hiddenLines = totalLines - visibleLines;

        if (hiddenLines <= 0) return;

        block.dataset.fullHeight = actualHeight;

        // Use CSS custom property for dynamic maxHeight, class for overflow
        pre.style.setProperty('--gh-collapse-height', maxHeight + 'px');
        pre.style.maxHeight = 'var(--gh-collapse-height)';
        block.classList.add('gh-enhancer-code-collapsed');

        const expandBtn = document.createElement('button');
        expandBtn.className = 'gh-enhancer-code-expand';
        expandBtn.setAttribute('type', 'button');
        expandBtn.innerHTML = `
          <svg class="gh-enhancer-expand-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 5.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 1.06-1.06L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          <span class="gh-enhancer-expand-text">Expand</span>
          <span class="gh-enhancer-expand-lines">+${hiddenLines} lines</span>
        `;

        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const isCurrentlyCollapsed = block.classList.contains('gh-enhancer-code-collapsed');

          if (isCurrentlyCollapsed) {
            // Expand
            block.classList.remove('gh-enhancer-code-collapsed');
            block.classList.add('gh-enhancer-code-expanded');
            expandBtn.querySelector('.gh-enhancer-expand-text').textContent = 'Collapse';
            expandBtn.querySelector('.gh-enhancer-expand-lines').textContent = `${totalLines} lines`;
            expandBtn.classList.add('gh-enhancer-code-expand-rotated');
          } else {
            // Collapse
            block.classList.remove('gh-enhancer-code-expanded');
            block.classList.add('gh-enhancer-code-collapsed');
            expandBtn.querySelector('.gh-enhancer-expand-text').textContent = 'Expand';
            expandBtn.querySelector('.gh-enhancer-expand-lines').textContent = `+${hiddenLines} lines`;
            expandBtn.classList.remove('gh-enhancer-code-expand-rotated');
          }
        });

        block.parentNode.insertBefore(expandBtn, block.nextSibling);
      });
    });
  }

  function init() {
    collapseCodeBlocks();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-code-expand').forEach(el => el.remove());
    document.querySelectorAll('.highlight[data-gh-enhancer-collapse]').forEach(block => {
      const pre = block.querySelector('pre');
      if (pre) {
        pre.style.removeProperty('--gh-collapse-height');
        pre.style.maxHeight = '';
      }
      block.classList.remove('gh-enhancer-code-collapsed', 'gh-enhancer-code-expanded');
      block.removeAttribute('data-gh-enhancer-collapse');
      block.removeAttribute('data-full-height');
    });
  }

  GH.codeCollapse = { init, reset };
})();
