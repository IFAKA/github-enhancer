// GitHub Enhancer - Collapse Toggle Module
// Makes the file directory collapsible
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Add collapse toggle to the file directory
   */
  function addCollapseToggle() {
    const latestCommitBox = GH.utils.findLatestCommitBox();
    const table = GH.utils.findFileTable();

    if (!latestCommitBox || !table) return;

    // Check if we already added the toggle
    if (latestCommitBox.querySelector('.gh-enhancer-toggle')) return;

    // Get all file/folder rows
    const tbody = table.querySelector('tbody');
    const allRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
    const fileRows = allRows.filter(row => row.classList.contains('react-directory-row'));

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'gh-enhancer-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle file list');
    toggleBtn.setAttribute('title', 'Toggle file list');
    toggleBtn.innerHTML = `
      <svg class="gh-enhancer-arrow" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M12.78 5.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 6.28a.75.75 0 011.06-1.06L8 8.94l3.72-3.72a.75.75 0 011.06 0z"/>
      </svg>
    `;

    // Find the "Add file" button container and move it to the LatestCommit box
    const actionsBox = document.querySelector('[class*="OverviewContent-module__Box_6"]');
    const addFileButton = actionsBox?.querySelector('[aria-label="Add file"]');
    if (addFileButton) {
      const addFileContainer = addFileButton.closest('div');
      if (addFileContainer) {
        addFileContainer.classList.add('gh-enhancer-add-file-container');
        latestCommitBox.appendChild(addFileContainer);
        addFileButton.classList.add('gh-enhancer-add-file');
        addFileButton.setAttribute('title', 'Add file');
      }
    }

    // Add toggle to the LatestCommit box
    latestCommitBox.appendChild(toggleBtn);

    const arrow = toggleBtn.querySelector('.gh-enhancer-arrow');

    // Check saved state, default to collapsed (true)
    let isCollapsed = true;
    try {
      const saved = localStorage.getItem('gh-enhancer-collapsed');
      if (saved === 'false') {
        isCollapsed = false;
      }
    } catch (e) {}

    // Apply initial state (collapsed by default)
    if (isCollapsed) {
      arrow.classList.add('gh-enhancer-collapsed');
      fileRows.forEach(row => row.classList.add('gh-enhancer-hidden'));
    }

    // Toggle click handler
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      isCollapsed = !isCollapsed;
      arrow.classList.toggle('gh-enhancer-collapsed', isCollapsed);

      fileRows.forEach(row => {
        row.classList.toggle('gh-enhancer-hidden', isCollapsed);
      });

      try {
        localStorage.setItem('gh-enhancer-collapsed', isCollapsed);
      } catch (e) {}
    });
  }

  function init() {
    addCollapseToggle();
  }

  function reset() {
    // Toggle buttons are removed when LatestCommit box is removed
  }

  GH.collapseToggle = { init, reset };
})();
