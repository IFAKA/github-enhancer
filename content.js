// GitHub Enhancer - Content Script
// Makes the file directory collapsible and moves repo actions to sidebar

(function() {
  'use strict';

  let isProcessed = false;
  let observer = null;
  let currentSectionElement = null;

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
   * Add current section indicator to the navigation tabs
   */
  function addSectionIndicator() {
    const navList = document.querySelector('ul.prc-components-UnderlineItemList-b23Hf[role="list"]');
    if (!navList || navList.querySelector('.gh-enhancer-section-indicator')) return;

    // Create the indicator element
    const sectionLi = document.createElement('li');
    sectionLi.className = 'prc-UnderlineNav-UnderlineNavItem--xDk1 gh-enhancer-section-indicator';
    sectionLi.style.display = 'none';

    sectionLi.innerHTML = `
      <a href="#" class="prc-components-UnderlineItem-lJsg- gh-enhancer-section-link">
        <span data-component="icon">
          <svg aria-hidden="true" focusable="false" class="octicon octicon-list-unordered" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="vertical-align:text-bottom">
            <path d="M5.75 2.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
          </svg>
        </span>
        <span class="gh-enhancer-section-text-wrapper">
          <span class="gh-enhancer-section-text" data-component="text"></span>
        </span>
      </a>
    `;

    navList.appendChild(sectionLi);

    // Click to scroll to current section
    sectionLi.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      if (currentSectionElement) {
        currentSectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Setup scroll tracking
    setupScrollTracking(sectionLi);
  }

  /**
   * Simple scroll-based section tracking
   */
  function setupScrollTracking(sectionLi) {
    const textSpan = sectionLi.querySelector('.gh-enhancer-section-text');
    const link = sectionLi.querySelector('a');
    let lastSectionIndex = -1;

    const updateCurrentSection = () => {
      // Get all headings fresh each time (in case DOM changed)
      const headings = document.querySelectorAll('.markdown-body .markdown-heading');
      if (headings.length === 0) return;

      // Find the last heading that has scrolled past the top (with 100px offset)
      let currentIndex = -1;
      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top < 100) {
          currentIndex = i;
        } else {
          break; // Headings below threshold, stop checking
        }
      }

      // No section passed yet
      if (currentIndex === -1) {
        sectionLi.style.display = 'none';
        currentSectionElement = null;
        lastSectionIndex = -1;
        return;
      }

      // Same section, no update needed
      if (currentIndex === lastSectionIndex) return;

      // Get heading text
      const heading = headings[currentIndex];
      const headingEl = heading.querySelector('.heading-element') || heading.querySelector('h1, h2, h3, h4, h5, h6');
      if (!headingEl) return;

      const sectionName = headingEl.textContent.trim();
      currentSectionElement = headingEl;

      // Determine animation direction
      const direction = currentIndex > lastSectionIndex ? 'down' : 'up';
      lastSectionIndex = currentIndex;

      // Show and animate
      sectionLi.style.display = '';
      textSpan.classList.remove('gh-enhancer-slide-up', 'gh-enhancer-slide-down');
      void textSpan.offsetWidth; // Force reflow
      textSpan.classList.add(direction === 'down' ? 'gh-enhancer-slide-down' : 'gh-enhancer-slide-up');
      textSpan.textContent = sectionName;

      // Update link href
      const anchor = heading.querySelector('a.anchor');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href) link.href = href;
      }
    };

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateCurrentSection();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial check
    updateCurrentSection();
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
    addSectionIndicator();

    console.log('[GitHub Enhancer] Page enhanced');
  }

  /**
   * Reset for SPA navigation
   */
  function reset() {
    isProcessed = false;
    currentSectionElement = null;

    // Restore hidden elements
    const repoHeader = document.querySelector('#repository-container-header[style*="display: none"]');
    if (repoHeader) repoHeader.style.display = '';

    // Remove added elements
    document.querySelectorAll('.gh-enhancer-repo-actions').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-section-indicator').forEach(el => el.remove());
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
