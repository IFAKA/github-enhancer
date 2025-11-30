// GitHub Enhancer - Content Script
// Makes the file directory collapsible and moves repo actions to sidebar

(function() {
  'use strict';

  let isProcessed = false;
  let observer = null;
  let currentSectionElement = null;
  let tocPanel = null;
  let lightboxOverlay = null;
  let currentFontSize = 100; // percentage

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

    // Add in order: Watch, Fork, Star (original GitHub order)
    if (watchItem) {
      const clone = watchItem.cloneNode(true);
      processActionButton(clone);
      actionsContainer.appendChild(clone);
    }
    if (forkItem) {
      const clone = forkItem.cloneNode(true);
      processActionButton(clone);
      actionsContainer.appendChild(clone);
    }
    if (starItem) {
      const clone = starItem.cloneNode(true);
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
   * Simplify file action buttons (Code, Add file, Go to file)
   */
  function simplifyFileActions() {
    // Find the file actions container
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
        // Replace content with just the plus icon
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

    // Find the "Add file" button container and move it to the LatestCommit box
    const actionsBox = document.querySelector('[class*="OverviewContent-module__Box_6"]');
    const addFileButton = actionsBox?.querySelector('[aria-label="Add file"]');
    if (addFileButton) {
      // Get the parent div that contains both button and overlay
      const addFileContainer = addFileButton.closest('div');
      if (addFileContainer) {
        addFileContainer.classList.add('gh-enhancer-add-file-container');
        latestCommitBox.appendChild(addFileContainer);
        // Simplify button appearance
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
   * Convert import statements in JS code blocks to clickable npm links (Ctrl/Cmd + click)
   */
  function linkifyImports() {
    // Find all JavaScript code blocks
    const jsCodeBlocks = document.querySelectorAll('.highlight-source-js pre, .highlight-source-ts pre, .highlight-source-tsx pre, .highlight-source-jsx pre');

    jsCodeBlocks.forEach(pre => {
      // Skip if already processed
      if (pre.dataset.ghEnhancerImports) return;
      pre.dataset.ghEnhancerImports = 'true';

      // Look for the 'from' keyword (pl-k class) followed by a string (pl-s class)
      const keywords = pre.querySelectorAll('span.pl-k');
      keywords.forEach(keyword => {
        const keywordText = keyword.textContent.trim();

        // Check for 'from' keyword
        if (keywordText === 'from') {
          // Find the next string span (may have whitespace/text nodes in between)
          let next = keyword.nextSibling;
          while (next) {
            if (next.nodeType === Node.ELEMENT_NODE && next.classList.contains('pl-s')) {
              markAsNpmLink(next);
              break;
            }
            // Skip whitespace text nodes
            if (next.nodeType === Node.TEXT_NODE && next.textContent.trim() === '') {
              next = next.nextSibling;
              continue;
            }
            // If we hit another element that's not pl-s, stop
            if (next.nodeType === Node.ELEMENT_NODE && !next.classList.contains('pl-s')) {
              break;
            }
            next = next.nextSibling;
          }
        }
      });

      // Look for require() calls - pl-en (function name) with text 'require'
      const functionNames = pre.querySelectorAll('span.pl-en');
      functionNames.forEach(fn => {
        if (fn.textContent.trim() === 'require') {
          // Find the string argument - look for pl-s after opening paren
          let next = fn.nextSibling;
          while (next) {
            if (next.nodeType === Node.ELEMENT_NODE && next.classList.contains('pl-s')) {
              markAsNpmLink(next);
              break;
            }
            // Skip parens and whitespace
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

    function markAsNpmLink(span) {
      const text = span.textContent;
      // Match package names in quotes: 'package-name' or 'package-name/subpath' or '@scope/package'
      const match = text.match(/^['"](@?[a-zA-Z0-9][-a-zA-Z0-9._]*(?:\/[a-zA-Z0-9][-a-zA-Z0-9._]*)?)(.*)['"]$/);

      if (match) {
        // Full import path (without quotes)
        const fullPath = match[1] + (match[2] || '');

        // Extract the package name (handle scoped packages like @scope/package)
        let packageName = match[1];
        if (!packageName.startsWith('@')) {
          packageName = packageName.split('/')[0];
        }

        // Build URL with text fragment if there's a subpath
        let npmUrl = `https://www.npmjs.com/package/${packageName}`;
        if (fullPath !== packageName) {
          // Add text fragment to highlight the full import path
          npmUrl += `#:~:text=${encodeURIComponent(fullPath)}`;
        }

        // Mark span as an npm link target
        span.classList.add('gh-enhancer-npm-target');
        span.dataset.npmPackage = packageName;
        span.dataset.npmUrl = npmUrl;
        span.title = `Ctrl/Cmd + click to view ${packageName} on npm`;
      }
    }
  }

  /**
   * Create Table of Contents sidebar panel
   */
  function createTOCPanel() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    // Remove existing panel
    if (tocPanel) tocPanel.remove();

    const headings = readme.querySelectorAll('.markdown-heading');
    if (headings.length < 3) return; // Don't show TOC for short READMEs

    // Create TOC panel
    tocPanel = document.createElement('div');
    tocPanel.className = 'gh-enhancer-toc-panel';
    tocPanel.innerHTML = `
      <div class="gh-enhancer-toc-header">
        <span>Contents</span>
        <button class="gh-enhancer-toc-close" aria-label="Close TOC">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
          </svg>
        </button>
      </div>
      <nav class="gh-enhancer-toc-nav"></nav>
    `;

    const nav = tocPanel.querySelector('.gh-enhancer-toc-nav');

    headings.forEach((heading, index) => {
      const headingEl = heading.querySelector('h1, h2, h3, h4, h5, h6');
      if (!headingEl) return;

      const level = parseInt(headingEl.tagName[1]);
      const text = headingEl.textContent.trim();
      const anchor = heading.querySelector('a.anchor');
      const href = anchor ? anchor.getAttribute('href') : `#heading-${index}`;

      const link = document.createElement('a');
      link.className = `gh-enhancer-toc-link gh-enhancer-toc-level-${level}`;
      link.href = href;
      link.textContent = text;
      link.dataset.headingIndex = index;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        headingEl.scrollIntoView({ behavior: 'smooth' });
      });

      nav.appendChild(link);
    });

    // Close button
    tocPanel.querySelector('.gh-enhancer-toc-close').addEventListener('click', () => {
      tocPanel.classList.add('gh-enhancer-toc-hidden');
      showTOCToggle();
    });

    document.body.appendChild(tocPanel);

    // Setup scroll tracking for TOC
    setupTOCScrollTracking(headings, nav);

    // Load saved state
    try {
      if (localStorage.getItem('gh-enhancer-toc-hidden') === 'true') {
        tocPanel.classList.add('gh-enhancer-toc-hidden');
        showTOCToggle();
      }
    } catch (e) {}
  }

  /**
   * Show TOC toggle button when panel is hidden
   */
  function showTOCToggle() {
    let toggle = document.querySelector('.gh-enhancer-toc-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'gh-enhancer-toc-toggle';
      toggle.setAttribute('aria-label', 'Show Table of Contents');
      toggle.setAttribute('title', 'Show Table of Contents');
      toggle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3.75-1.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM3 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
        </svg>
      `;
      toggle.addEventListener('click', () => {
        if (tocPanel) {
          tocPanel.classList.remove('gh-enhancer-toc-hidden');
          toggle.style.display = 'none';
          try {
            localStorage.setItem('gh-enhancer-toc-hidden', 'false');
          } catch (e) {}
        }
      });
      document.body.appendChild(toggle);
    }
    toggle.style.display = 'flex';
    try {
      localStorage.setItem('gh-enhancer-toc-hidden', 'true');
    } catch (e) {}
  }

  /**
   * Setup scroll tracking for TOC highlighting
   */
  function setupTOCScrollTracking(headings, nav) {
    const links = nav.querySelectorAll('.gh-enhancer-toc-link');

    const updateActiveLink = () => {
      let currentIndex = -1;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top < 120) {
          currentIndex = i;
        } else {
          break;
        }
      }

      links.forEach((link, i) => {
        link.classList.toggle('gh-enhancer-toc-active', i === currentIndex);
      });

      // Scroll active link into view in TOC
      if (currentIndex >= 0 && links[currentIndex]) {
        links[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    });

    updateActiveLink();
  }

  /**
   * Add anchor link preview on hover
   */
  function addAnchorLinkPreviews() {
    const readme = document.querySelector('.markdown-body');
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

        // Get preview content
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

        // Create popup
        if (previewPopup) previewPopup.remove();
        previewPopup = document.createElement('div');
        previewPopup.className = 'gh-enhancer-anchor-preview';
        previewPopup.innerHTML = `
          <strong>${heading.textContent.trim()}</strong>
          <p>${previewContent.trim()}</p>
        `;

        document.body.appendChild(previewPopup);

        // Position popup
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

  /**
   * Collapse tall code blocks - simple approach
   */
  function collapseCodeBlocks() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    const codeBlocks = readme.querySelectorAll('.highlight');
    const maxHeight = Math.floor(window.innerHeight * 0.4); // 40% of viewport

    codeBlocks.forEach(block => {
      if (block.dataset.ghEnhancerCollapse) return;
      block.dataset.ghEnhancerCollapse = 'true';

      const pre = block.querySelector('pre');
      if (!pre) return;

      // Wait for render to get accurate height
      requestAnimationFrame(() => {
        const actualHeight = pre.scrollHeight;
        if (actualHeight <= maxHeight) return;

        // Store original height
        block.dataset.fullHeight = actualHeight;

        // Apply collapsed state directly to pre
        pre.style.maxHeight = maxHeight + 'px';
        pre.style.overflow = 'hidden';
        block.classList.add('gh-enhancer-code-collapsed');

        // Create expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'gh-enhancer-code-expand';
        expandBtn.setAttribute('type', 'button');
        expandBtn.innerHTML = `
          <svg class="gh-enhancer-expand-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 5.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 1.06-1.06L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          <span class="gh-enhancer-expand-text">Expand</span>
          <span class="gh-enhancer-expand-lines">${Math.round(actualHeight / 20)} lines</span>
        `;

        let isCollapsed = true;

        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          isCollapsed = !isCollapsed;

          if (isCollapsed) {
            pre.style.maxHeight = maxHeight + 'px';
            pre.style.overflow = 'hidden';
            block.classList.add('gh-enhancer-code-collapsed');
            expandBtn.querySelector('.gh-enhancer-expand-text').textContent = 'Expand';
            expandBtn.querySelector('.gh-enhancer-expand-icon').style.transform = '';
          } else {
            pre.style.maxHeight = 'none';
            pre.style.overflow = 'visible';
            block.classList.remove('gh-enhancer-code-collapsed');
            expandBtn.querySelector('.gh-enhancer-expand-text').textContent = 'Collapse';
            expandBtn.querySelector('.gh-enhancer-expand-icon').style.transform = 'rotate(180deg)';
          }
        });

        // Insert button after the highlight block
        block.parentNode.insertBefore(expandBtn, block.nextSibling);
      });
    });
  }

  /**
   * Create image lightbox
   */
  function createLightbox() {
    if (lightboxOverlay) return;

    lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'gh-enhancer-lightbox';
    lightboxOverlay.innerHTML = `
      <div class="gh-enhancer-lightbox-backdrop"></div>
      <div class="gh-enhancer-lightbox-container">
        <div class="gh-enhancer-lightbox-image-wrapper">
          <img class="gh-enhancer-lightbox-image" src="" alt="">
        </div>
      </div>
      <div class="gh-enhancer-lightbox-controls">
        <button class="gh-enhancer-lightbox-btn" data-action="zoom-out" title="Zoom out">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.5 8a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3.5 8Z"/>
            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-4.5 6a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/>
          </svg>
        </button>
        <span class="gh-enhancer-lightbox-zoom">100%</span>
        <button class="gh-enhancer-lightbox-btn" data-action="zoom-in" title="Zoom in">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.5 3.5a.75.75 0 0 1 .75.75V6.5h2.25a.75.75 0 0 1 0 1.5H7.25v2.25a.75.75 0 0 1-1.5 0V8H3.5a.75.75 0 0 1 0-1.5h2.25V4.25a.75.75 0 0 1 .75-.75Z"/>
            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-4.5 6a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/>
          </svg>
        </button>
        <div class="gh-enhancer-lightbox-divider"></div>
        <button class="gh-enhancer-lightbox-btn" data-action="copy" title="Copy to clipboard">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
          </svg>
        </button>
        <button class="gh-enhancer-lightbox-btn" data-action="download" title="Download image">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
            <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
          </svg>
        </button>
        <div class="gh-enhancer-lightbox-divider"></div>
        <button class="gh-enhancer-lightbox-btn gh-enhancer-lightbox-close" data-action="close" title="Close">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(lightboxOverlay);

    let currentZoom = 100;
    let currentImageSrc = '';
    const img = lightboxOverlay.querySelector('.gh-enhancer-lightbox-image');
    const imageWrapper = lightboxOverlay.querySelector('.gh-enhancer-lightbox-image-wrapper');
    const zoomLabel = lightboxOverlay.querySelector('.gh-enhancer-lightbox-zoom');

    // Pan/drag state
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    // Mouse down - start panning
    img.addEventListener('mousedown', (e) => {
      if (currentZoom <= 100) return; // Only pan when zoomed in
      e.preventDefault();
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      img.style.cursor = 'grabbing';
    });

    // Mouse move - pan
    document.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateImageTransform();
    });

    // Mouse up - stop panning
    document.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        img.style.cursor = currentZoom > 100 ? 'grab' : 'zoom-in';
      }
    });

    // Update image transform with both zoom and pan
    function updateImageTransform() {
      img.style.transform = `scale(${currentZoom / 100}) translate(${translateX / (currentZoom / 100)}px, ${translateY / (currentZoom / 100)}px)`;
    }

    // Reset pan when zoom changes
    function resetPan() {
      translateX = 0;
      translateY = 0;
    }

    // Handle control clicks
    lightboxOverlay.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case 'zoom-in':
          img.classList.add('gh-enhancer-zooming');
          currentZoom = Math.min(currentZoom + 25, 300);
          updateImageTransform();
          zoomLabel.textContent = `${currentZoom}%`;
          img.style.cursor = currentZoom > 100 ? 'grab' : 'zoom-in';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case 'zoom-out':
          img.classList.add('gh-enhancer-zooming');
          currentZoom = Math.max(currentZoom - 25, 25);
          if (currentZoom <= 100) resetPan();
          updateImageTransform();
          zoomLabel.textContent = `${currentZoom}%`;
          img.style.cursor = currentZoom > 100 ? 'grab' : 'zoom-in';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case 'copy':
          try {
            // Fetch the image as blob
            const response = await fetch(currentImageSrc);
            const blob = await response.blob();

            // Create a canvas to convert to PNG (more compatible with clipboard)
            const imgEl = new Image();
            imgEl.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
              imgEl.onload = resolve;
              imgEl.onerror = reject;
              imgEl.src = currentImageSrc;
            });

            const canvas = document.createElement('canvas');
            canvas.width = imgEl.naturalWidth;
            canvas.height = imgEl.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgEl, 0, 0);

            canvas.toBlob(async (pngBlob) => {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': pngBlob })
                ]);
                btn.classList.add('gh-enhancer-lightbox-btn-success');
                setTimeout(() => {
                  btn.classList.remove('gh-enhancer-lightbox-btn-success');
                }, 1500);
              } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                // Fallback: copy URL
                await navigator.clipboard.writeText(currentImageSrc);
                btn.classList.add('gh-enhancer-lightbox-btn-success');
                setTimeout(() => {
                  btn.classList.remove('gh-enhancer-lightbox-btn-success');
                }, 1500);
              }
            }, 'image/png');
          } catch (err) {
            console.error('Failed to copy image:', err);
            // Fallback: copy URL
            try {
              await navigator.clipboard.writeText(currentImageSrc);
              btn.classList.add('gh-enhancer-lightbox-btn-success');
              setTimeout(() => {
                btn.classList.remove('gh-enhancer-lightbox-btn-success');
              }, 1500);
            } catch (e) {}
          }
          break;
        case 'download':
          btn.classList.add('gh-enhancer-lightbox-btn-downloading');
          try {
            // Fetch image and create blob URL for download
            const response = await fetch(currentImageSrc);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            // Extract filename from URL
            const urlPath = new URL(currentImageSrc).pathname;
            const filename = urlPath.split('/').pop() || 'image.png';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

            setTimeout(() => {
              btn.classList.remove('gh-enhancer-lightbox-btn-downloading');
            }, 1000);
          } catch (err) {
            console.error('Download failed:', err);
            btn.classList.remove('gh-enhancer-lightbox-btn-downloading');
            // Fallback: open in new tab
            window.open(currentImageSrc, '_blank');
          }
          break;
        case 'close':
          closeLightbox();
          break;
      }
    });

    // Close on backdrop click
    lightboxOverlay.querySelector('.gh-enhancer-lightbox-backdrop').addEventListener('click', closeLightbox);

    // Keyboard controls for lightbox
    document.addEventListener('keydown', (e) => {
      if (!lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case '+':
        case '=':
          e.preventDefault();
          img.classList.add('gh-enhancer-zooming');
          currentZoom = Math.min(currentZoom + 25, 300);
          updateImageTransform();
          zoomLabel.textContent = `${currentZoom}%`;
          img.style.cursor = currentZoom > 100 ? 'grab' : 'zoom-in';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case '-':
          e.preventDefault();
          img.classList.add('gh-enhancer-zooming');
          currentZoom = Math.max(currentZoom - 25, 25);
          if (currentZoom <= 100) resetPan();
          updateImageTransform();
          zoomLabel.textContent = `${currentZoom}%`;
          img.style.cursor = currentZoom > 100 ? 'grab' : 'zoom-in';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case '0':
          e.preventDefault();
          img.classList.add('gh-enhancer-zooming');
          currentZoom = 100;
          resetPan();
          updateImageTransform();
          zoomLabel.textContent = '100%';
          img.style.cursor = 'zoom-in';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
      }
    });

    function closeLightbox() {
      lightboxOverlay.classList.remove('gh-enhancer-lightbox-visible');
      currentZoom = 100;
      resetPan();
      img.style.transform = '';
      img.style.cursor = 'zoom-in';
      zoomLabel.textContent = '100%';
    }

    // Expose method to open lightbox
    lightboxOverlay.openImage = (src) => {
      currentImageSrc = src;
      img.src = src;
      lightboxOverlay.classList.add('gh-enhancer-lightbox-visible');
    };
  }

  /**
   * Add click handlers to images for lightbox
   */
  function setupImageLightbox() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    createLightbox();

    const images = readme.querySelectorAll('img:not([alt*="badge"]):not([src*="shields.io"]):not([src*="img.shields"])');

    images.forEach(img => {
      if (img.dataset.ghEnhancerLightbox) return;
      img.dataset.ghEnhancerLightbox = 'true';

      // Skip small images (likely badges or icons)
      if (img.naturalWidth < 100 && img.naturalHeight < 100) return;

      img.classList.add('gh-enhancer-lightbox-target');

      // Handle click - prevent link navigation
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get the actual image source (handle GitHub's camo proxy)
        let imageSrc = img.src;
        // If it's a camo URL, try to get the original from data-canonical-src
        if (img.dataset.canonicalSrc) {
          imageSrc = img.dataset.canonicalSrc;
        }

        lightboxOverlay.openImage(imageSrc);
      });

      // Also prevent the parent link from navigating
      const parentLink = img.closest('a');
      if (parentLink) {
        parentLink.addEventListener('click', (e) => {
          if (e.target === img || e.target.closest('img') === img) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    });
  }

  /**
   * Add external link indicators
   */
  function addExternalLinkIndicators() {
    const readme = document.querySelector('.markdown-body');
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
          // Add icon after link text
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

  /**
   * Add font size controls to sidebar
   */
  function addFontSizeControls() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    // Find the sidebar
    const sidebar = document.querySelector('.Layout-sidebar .BorderGrid');
    if (!sidebar) return;

    // Check if controls already exist
    if (document.querySelector('.gh-enhancer-font-controls-row')) return;

    // Load saved font size
    try {
      const saved = localStorage.getItem('gh-enhancer-font-size');
      if (saved) {
        currentFontSize = parseInt(saved);
        readme.style.fontSize = `${currentFontSize}%`;
      }
    } catch (e) {}

    // Create sidebar row
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
          <span class="gh-enhancer-font-size">${currentFontSize}%</span>
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
          currentFontSize = Math.min(currentFontSize + 10, 200);
          break;
        case 'decrease':
          currentFontSize = Math.max(currentFontSize - 10, 50);
          break;
        case 'reset':
          currentFontSize = 100;
          break;
      }

      readme.style.fontSize = `${currentFontSize}%`;
      sizeLabel.textContent = `${currentFontSize}%`;

      try {
        localStorage.setItem('gh-enhancer-font-size', currentFontSize);
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
      // Don't trigger if lightbox is open
      if (lightboxOverlay && lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) {
        return;
      }

      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // + or = to increase font size
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        currentFontSize = Math.min(currentFontSize + 10, 200);
        readme.style.fontSize = `${currentFontSize}%`;
        sizeLabel.textContent = `${currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', currentFontSize); } catch (err) {}
      }

      // - to decrease font size
      if (e.key === '-') {
        e.preventDefault();
        currentFontSize = Math.max(currentFontSize - 10, 50);
        readme.style.fontSize = `${currentFontSize}%`;
        sizeLabel.textContent = `${currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', currentFontSize); } catch (err) {}
      }

      // 0 to reset font size
      if (e.key === '0') {
        e.preventDefault();
        currentFontSize = 100;
        readme.style.fontSize = `${currentFontSize}%`;
        sizeLabel.textContent = `${currentFontSize}%`;
        try { localStorage.setItem('gh-enhancer-font-size', currentFontSize); } catch (err) {}
      }
    });
  }

  /**
   * Add estimated reading time to sidebar
   */
  function addReadingTime() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    // Find the sidebar
    const sidebar = document.querySelector('.Layout-sidebar .BorderGrid');
    if (!sidebar) return;

    // Check if already added
    if (document.querySelector('.gh-enhancer-reading-time-row')) return;

    // Calculate reading time (average 200 words per minute)
    const text = readme.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Create sidebar row
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

  /**
   * Add badge explanation tooltips
   */
  function addBadgeTooltips() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    const badges = readme.querySelectorAll('img[src*="shields.io"], img[src*="img.shields"], img[alt*="badge"], img[alt*="status"]');

    const badgePatterns = [
      { pattern: /build|ci|test|workflow/i, explanation: 'Build Status: Shows if automated tests/CI pipeline is passing' },
      { pattern: /coverage|codecov|coveralls/i, explanation: 'Code Coverage: Percentage of code covered by tests' },
      { pattern: /npm.*v|version/i, explanation: 'npm Version: Current published version on npm registry' },
      { pattern: /downloads/i, explanation: 'Downloads: Number of times this package has been downloaded' },
      { pattern: /license/i, explanation: 'License: The open source license this project uses' },
      { pattern: /discord|chat|slack/i, explanation: 'Community Chat: Join the community chat for support' },
      { pattern: /bundle.*size|size/i, explanation: 'Bundle Size: Minified/gzipped size when added to your project' },
      { pattern: /dependencies|deps/i, explanation: 'Dependencies: Status of project dependencies' },
      { pattern: /stars|github/i, explanation: 'GitHub Stars: Popularity indicator on GitHub' },
      { pattern: /typescript|types/i, explanation: 'TypeScript: This package includes TypeScript type definitions' },
    ];

    badges.forEach(badge => {
      if (badge.dataset.ghEnhancerTooltip) return;
      badge.dataset.ghEnhancerTooltip = 'true';

      const alt = badge.alt || '';
      const src = badge.src || '';
      const combined = alt + ' ' + src;

      for (const { pattern, explanation } of badgePatterns) {
        if (pattern.test(combined)) {
          badge.classList.add('gh-enhancer-badge');
          badge.title = explanation;
          break;
        }
      }
    });
  }

  /**
   * Setup global keyboard listeners for Ctrl/Cmd + click on npm links
   */
  function setupNpmLinkHandlers() {
    // Track modifier key state
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

    // Handle blur to reset state when window loses focus
    window.addEventListener('blur', () => {
      isModifierPressed = false;
      document.body.classList.remove('gh-enhancer-ctrl-pressed');
    });

    // Handle clicks on npm targets
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

  /**
   * Main enhance function
   */
  function enhance() {
    if (isProcessed) return;
    if (!isRepoMainPage()) return;

    isProcessed = true;

    moveRepoActionsToSidebar();
    simplifyFileActions();
    addCollapseToggle();
    addSectionIndicator();
    linkifyImports();

    // README enhancements
    createTOCPanel();
    addAnchorLinkPreviews();
    collapseCodeBlocks();
    setupImageLightbox();
    addExternalLinkIndicators();
    addFontSizeControls();
    addReadingTime();
    addBadgeTooltips();

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
    document.querySelectorAll('.gh-enhancer-toc-panel').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-toc-toggle').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-font-controls').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-font-controls-row').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-reading-time').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-reading-time-row').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-anchor-preview').forEach(el => el.remove());
    document.querySelectorAll('.gh-enhancer-code-expand').forEach(el => el.remove());
    // Reset code blocks
    document.querySelectorAll('.highlight[data-gh-enhancer-collapse]').forEach(block => {
      const pre = block.querySelector('pre');
      if (pre) {
        pre.style.maxHeight = '';
        pre.style.overflow = '';
      }
      block.classList.remove('gh-enhancer-code-collapsed');
      block.removeAttribute('data-gh-enhancer-collapse');
      block.removeAttribute('data-full-height');
    });
    document.querySelectorAll('.gh-enhancer-external-icon').forEach(el => el.remove());

    // Reset TOC panel reference
    tocPanel = null;

    // Reset font size
    const readme = document.querySelector('.markdown-body');
    if (readme) readme.style.fontSize = '';
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
    setupNpmLinkHandlers();

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
