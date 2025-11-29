// GitHub Enhancer - Content Script
// Makes the file directory collapsible and moves repo actions to sidebar

(function() {
  'use strict';

  let isProcessed = false;
  let observer = null;

  /**
   * Check if current page is a repo main page
   */
  function isRepoMainPage() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) return false;

    const excludedPaths = ['issues', 'pulls', 'actions', 'projects', 'wiki', 'security', 'pulse', 'settings', 'discussions', 'blob', 'commit', 'commits'];
    if (parts.length > 2 && excludedPaths.includes(parts[2])) {
      return false;
    }

    return document.querySelector('#repo-content-pjax-container, .repository-content') !== null;
  }

  /**
   * Find the LatestCommit box
   */
  function findLatestCommitBox() {
    return document.querySelector('[class*="LatestCommit-module__Box"]');
  }

  /**
   * Find the file tree table
   */
  function findFileTable() {
    return document.querySelector('table[aria-labelledby="folders-and-files"]') ||
           document.querySelector('[data-hpc="true"] table');
  }

  /**
   * Process button to remove text labels but keep icons and counters
   * Adds title attribute for hover tooltip
   */
  function processActionButton(container) {
    // Find all clickable elements (buttons, links, summaries)
    const buttons = container.querySelectorAll('.BtnGroup-item, .btn, .Button, summary, button, a');

    buttons.forEach(btn => {
      // Get title from aria-label first
      const ariaLabel = btn.getAttribute('aria-label');
      if (ariaLabel && !btn.getAttribute('title')) {
        btn.setAttribute('title', ariaLabel);
      }

      // Find and remove text spans but keep counters and icons
      btn.querySelectorAll('span').forEach(span => {
        // Skip if it's a counter or contains a counter
        if (span.classList.contains('Counter') || span.querySelector('.Counter')) return;
        // Skip if it contains an icon
        if (span.querySelector('svg, [class*="octicon"]')) return;
        // Skip if it's an icon itself
        if (span.className && span.className.includes('octicon')) return;

        const text = span.textContent?.trim();
        if (text && !btn.getAttribute('title')) {
          btn.setAttribute('title', text);
        }
        span.remove();
      });

      // Remove direct text nodes
      btn.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text && !btn.getAttribute('title')) {
            btn.setAttribute('title', text);
          }
          node.textContent = '';
        }
      });
    });

    // Handle details/summary elements (watch button uses this)
    const details = container.querySelector('details');
    if (details) {
      const summary = details.querySelector('summary');
      if (summary) {
        // Get text for title before removing
        let titleText = summary.getAttribute('aria-label') || '';
        if (!titleText) {
          summary.querySelectorAll('span').forEach(span => {
            if (!span.classList.contains('Counter') && !span.querySelector('.Counter') &&
                !span.querySelector('svg') && !span.className?.includes('octicon')) {
              const text = span.textContent?.trim();
              if (text) titleText = text;
            }
          });
        }
        if (titleText && !summary.getAttribute('title')) {
          summary.setAttribute('title', titleText);
        }

        // Remove text spans from summary
        summary.querySelectorAll('span').forEach(span => {
          if (span.classList.contains('Counter') || span.querySelector('.Counter')) return;
          if (span.querySelector('svg, [class*="octicon"]')) return;
          if (span.className && span.className.includes('octicon')) return;
          span.remove();
        });

        // Remove direct text nodes from summary
        summary.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = '';
          }
        });
      }
    }
  }

  /**
   * Move repo action buttons to sidebar
   */
  function moveRepoActionsToSidebar() {
    const detailsContainer = document.querySelector('#repository-details-container');
    const sidebar = document.querySelector('.Layout-sidebar .BorderGrid.about-margin') ||
                    document.querySelector('.Layout-sidebar .BorderGrid');

    if (!detailsContainer || !sidebar) return;

    // Check if already moved
    if (sidebar.querySelector('.gh-enhancer-repo-actions')) return;

    const actionsList = detailsContainer.querySelector('.pagehead-actions');
    if (!actionsList) return;

    const listItems = Array.from(actionsList.querySelectorAll(':scope > li'));

    // Find star, fork, watch buttons
    let starItem = null, forkItem = null, watchItem = null;

    listItems.forEach(li => {
      if (li.querySelector('.starring-container, [data-ga-click*="star"], .js-toggler-container')) {
        starItem = li;
      } else if (li.querySelector('#fork-button, [data-ga-click*="fork"]')) {
        forkItem = li;
      } else if (li.querySelector('[src*="watch"], [aria-label*="Watch"]')) {
        watchItem = li;
      }
    });

    // Create wrapper for sidebar
    const wrapper = document.createElement('div');
    wrapper.className = 'BorderGrid-row gh-enhancer-repo-actions';

    const cell = document.createElement('div');
    cell.className = 'BorderGrid-cell';

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'gh-enhancer-actions-container';

    // Add in order: Stars, Forks, Watch
    if (starItem) {
      const clone = starItem.cloneNode(true);
      processActionButton(clone);
      actionsContainer.appendChild(clone);
    }
    if (forkItem) {
      const clone = forkItem.cloneNode(true);
      processActionButton(clone);
      actionsContainer.appendChild(clone);
    }
    if (watchItem) {
      const clone = watchItem.cloneNode(true);
      processActionButton(clone);
      actionsContainer.appendChild(clone);
    }

    cell.appendChild(actionsContainer);
    wrapper.appendChild(cell);

    // Observe for lazy-loaded content (like watch button React component)
    const actionsObserver = new MutationObserver(() => {
      // Find watch buttons (React component)
      actionsContainer.querySelectorAll('[class*="prc-Button-ButtonBase"], [aria-label*="Watch"]').forEach(btn => {
        const ariaLabel = btn.getAttribute('aria-label');
        if (ariaLabel && !btn.getAttribute('title')) {
          // Extract just "Watch" from "Watch: Participating in..."
          const title = ariaLabel.split(':')[0] || ariaLabel;
          btn.setAttribute('title', title);
        }
      });
    });
    actionsObserver.observe(actionsContainer, {
      childList: true,
      subtree: true
    });
    // Run once immediately for already loaded content
    actionsContainer.querySelectorAll('[class*="prc-Button-ButtonBase"], [aria-label*="Watch"]').forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      if (ariaLabel && !btn.getAttribute('title')) {
        const title = ariaLabel.split(':')[0] || ariaLabel;
        btn.setAttribute('title', title);
      }
    });

    // Insert at the top of BorderGrid (before first row)
    const firstRow = sidebar.querySelector('.BorderGrid-row');
    if (firstRow) {
      sidebar.insertBefore(wrapper, firstRow);
    } else {
      sidebar.appendChild(wrapper);
    }

    // Hide the original repository-container-header
    const repoHeader = document.querySelector('#repository-container-header');
    if (repoHeader) {
      repoHeader.style.display = 'none';
    }

    // Set padding-top: 0 on OverviewContent-module__Box_1
    const overviewBox = document.querySelector('[class*="OverviewContent-module__Box_1"]');
    if (overviewBox) {
      overviewBox.style.paddingTop = '0';
    }
  }

  /**
   * Add collapse toggle to the file directory
   */
  function addCollapseToggle() {
    const latestCommitBox = findLatestCommitBox();
    const table = findFileTable();

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

  /**
   * Main enhance function
   */
  function enhance() {
    if (isProcessed) return;
    if (!isRepoMainPage()) return;

    isProcessed = true;

    moveRepoActionsToSidebar();
    addCollapseToggle();

    console.log('[GitHub Enhancer] Page enhanced');
  }

  /**
   * Reset for SPA navigation
   */
  function reset() {
    isProcessed = false;

    // Restore hidden elements
    const repoHeader = document.querySelector('#repository-container-header[style*="display: none"]');
    if (repoHeader) repoHeader.style.display = '';

    // Remove added elements
    document.querySelectorAll('.gh-enhancer-repo-actions').forEach(el => el.remove());
  }

  /**
   * Setup mutation observer
   */
  function setupObserver() {
    if (observer) return;

    let lastUrl = location.href;

    observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        reset();
        setTimeout(enhance, 500);
      } else if (!isProcessed) {
        enhance();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enhance);
    } else {
      enhance();
    }

    setupObserver();

    document.addEventListener('turbo:load', () => {
      reset();
      setTimeout(enhance, 100);
    });

    document.addEventListener('pjax:end', () => {
      reset();
      setTimeout(enhance, 100);
    });
  }

  init();
})();
