// GitHub Enhancer - Anchor Preview Module
// Adds anchor link preview on hover
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Add anchor link preview on hover
   */
  function addAnchorLinkPreviews() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const internalLinks = readme.querySelectorAll('a[href^="#"]');
    let previewPopup = null;

    internalLinks.forEach(link => {
      if (link.dataset.ghEnhancerPreview) return;
      link.dataset.ghEnhancerPreview = 'true';

      link.addEventListener('mouseenter', (e) => {
        const targetId = link.getAttribute('href').slice(1);
        const targetEl = document.getElementById(targetId) ||
                         document.getElementById('user-content-' + targetId);

        if (!targetEl) return;

        const heading = targetEl.closest('.markdown-heading');
        if (!heading) return;

        let previewContent = '';
        let sibling = heading.nextElementSibling;
        let count = 0;

        while (sibling && count < 3) {
          if (sibling.classList.contains('markdown-heading')) break;
          if (sibling.tagName === 'P' || sibling.tagName === 'UL' || sibling.tagName === 'OL') {
            previewContent += sibling.textContent.slice(0, 150) + (sibling.textContent.length > 150 ? '...' : '') + ' ';
            count++;
          }
          sibling = sibling.nextElementSibling;
        }

        if (!previewContent.trim()) return;

        if (previewPopup) previewPopup.remove();
        previewPopup = document.createElement('div');
        previewPopup.className = 'gh-enhancer-anchor-preview';
        previewPopup.innerHTML = `
          <strong>${heading.textContent.trim()}</strong>
          <p>${previewContent.trim()}</p>
        `;

        document.body.appendChild(previewPopup);

        const rect = link.getBoundingClientRect();
        previewPopup.style.left = `${rect.left + window.scrollX}px`;
        previewPopup.style.top = `${rect.bottom + window.scrollY + 8}px`;
      });

      link.addEventListener('mouseleave', () => {
        if (previewPopup) {
          previewPopup.remove();
          previewPopup = null;
        }
      });
    });
  }

  function init() {
    addAnchorLinkPreviews();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-anchor-preview').forEach(el => el.remove());
  }

  GH.anchorPreview = { init, reset };
})();
