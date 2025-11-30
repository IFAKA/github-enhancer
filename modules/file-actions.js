// GitHub Enhancer - File Actions Module
// Simplifies file action buttons (Code, Add file, Go to file)
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Simplify file action buttons (Code, Add file, Go to file)
   */
  function simplifyFileActions() {
    const actionsBox = document.querySelector('[class*="OverviewContent-module__Box_6"]');
    if (!actionsBox) return;
    if (actionsBox.dataset.ghEnhanced) return;
    actionsBox.dataset.ghEnhanced = 'true';

    // 1. Simplify "Code" button - remove text, keep icon, add title
    const codeButton = actionsBox.querySelector('button[data-variant="primary"]');
    if (codeButton) {
      codeButton.setAttribute('title', 'Code');
      const codeLabel = codeButton.querySelector('[class*="prc-Button-Label"]');
      if (codeLabel) {
        codeLabel.style.display = 'none';
      }
    }

    // 2. Simplify "Add file" button - replace with plus icon only
    const addFileButton = actionsBox.querySelector('[aria-label="Add file"]');
    if (addFileButton) {
      addFileButton.setAttribute('title', 'Add file');
      const addFileLabel = addFileButton.querySelector('[class*="prc-Button-Label"]');
      if (addFileLabel) {
        addFileLabel.innerHTML = `
          <svg aria-hidden="true" focusable="false" class="octicon octicon-plus" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="vertical-align: text-bottom;">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
          </svg>
        `;
      }
    }

    // 3. Hide the "Go to file" text button (keep only the search input)
    const goToFileBtn = actionsBox.querySelector('button[data-no-visuals="true"]:not([aria-label])');
    if (goToFileBtn) {
      const labelSpan = goToFileBtn.querySelector('[class*="prc-Button-Label"]');
      if (labelSpan && labelSpan.textContent.trim() === 'Go to file') {
        goToFileBtn.style.display = 'none';
      }
    }
  }

  function init() {
    simplifyFileActions();
  }

  function reset() {
    // Reset enhanced flag on file actions box
    const actionsBox = document.querySelector('[class*="OverviewContent-module__Box_6"][data-gh-enhanced]');
    if (actionsBox) {
      actionsBox.removeAttribute('data-gh-enhanced');
    }
  }

  GH.fileActions = { init, reset };
})();
