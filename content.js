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

        // Calculate lines (approximate line height of 20px)
        const lineHeight = 20;
        const totalLines = Math.round(actualHeight / lineHeight);
        const visibleLines = Math.round(maxHeight / lineHeight);
        const hiddenLines = totalLines - visibleLines;

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
          <span class="gh-enhancer-expand-lines">+${hiddenLines} lines</span>
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
            expandBtn.querySelector('.gh-enhancer-expand-lines').textContent = `+${hiddenLines} lines`;
            expandBtn.querySelector('.gh-enhancer-expand-icon').style.transform = '';
          } else {
            pre.style.maxHeight = 'none';
            pre.style.overflow = 'visible';
            block.classList.remove('gh-enhancer-code-collapsed');
            expandBtn.querySelector('.gh-enhancer-expand-text').textContent = 'Collapse';
            expandBtn.querySelector('.gh-enhancer-expand-lines').textContent = `${totalLines} lines`;
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

    // Track if we dragged (to distinguish from click)
    let hasDragged = false;
    let mouseDownTime = 0;

    // Mouse down - start panning
    img.addEventListener('mousedown', (e) => {
      mouseDownTime = Date.now();
      hasDragged = false;

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
      hasDragged = true;
      e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateImageTransform();
    });

    // Mouse up - stop panning
    document.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        img.style.cursor = ''; // Reset to CSS default (zoom-in or zoom-out based on Ctrl/Cmd)
      }
    });

    // Click on image to zoom in, Ctrl/Cmd + click to zoom out
    img.addEventListener('click', (e) => {
      // Don't zoom if we were dragging/panning
      if (hasDragged || Date.now() - mouseDownTime > 200) return;

      e.preventDefault();
      e.stopPropagation();

      img.classList.add('gh-enhancer-zooming');

      if (e.ctrlKey || e.metaKey) {
        // Zoom out
        currentZoom = Math.max(currentZoom - 25, 25);
        if (currentZoom <= 100) resetPan();
      } else {
        // Zoom in
        currentZoom = Math.min(currentZoom + 25, 300);
      }

      updateImageTransform();
      zoomLabel.textContent = `${currentZoom}%`;
      setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
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

    // Store reference to source image for close transition
    let sourceImageRef = null;

    lightboxOverlay.setSourceImage = (sourceImg) => {
      sourceImageRef = sourceImg;
    };

    // Close function with View Transition support
    function closeLightbox() {
      if (document.startViewTransition && sourceImageRef) {
        // Animate back to source image
        document.startViewTransition(() => {
          img.style.viewTransitionName = '';
          sourceImageRef.style.viewTransitionName = 'lightbox-hero';
          lightboxOverlay.classList.remove('gh-enhancer-lightbox-visible');
        }).finished.then(() => {
          // Clean up
          sourceImageRef.style.viewTransitionName = '';
          sourceImageRef = null;
          currentZoom = 100;
          resetPan();
          img.style.transform = '';
          img.style.cursor = 'zoom-in';
          zoomLabel.textContent = '100%';
        }).catch(() => {
          // Handle errors silently
        });
      } else {
        // Fallback: no animation
        lightboxOverlay.classList.remove('gh-enhancer-lightbox-visible');
        sourceImageRef = null;
        currentZoom = 100;
        resetPan();
        img.style.transform = '';
        img.style.cursor = 'zoom-in';
        zoomLabel.textContent = '100%';
      }
    }

    // Close on backdrop click
    lightboxOverlay.querySelector('.gh-enhancer-lightbox-backdrop').addEventListener('click', closeLightbox);

    // Track Ctrl/Cmd key state for cursor changes
    document.addEventListener('keydown', (e) => {
      if (!lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) return;

      // Track modifier key for zoom-out cursor
      if (e.ctrlKey || e.metaKey) {
        lightboxOverlay.classList.add('gh-enhancer-ctrl-pressed');
      }

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
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case '-':
          e.preventDefault();
          img.classList.add('gh-enhancer-zooming');
          currentZoom = Math.max(currentZoom - 25, 25);
          if (currentZoom <= 100) resetPan();
          updateImageTransform();
          zoomLabel.textContent = `${currentZoom}%`;
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
        case '0':
          e.preventDefault();
          img.classList.add('gh-enhancer-zooming');
          currentZoom = 100;
          resetPan();
          updateImageTransform();
          zoomLabel.textContent = '100%';
          setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
          break;
      }
    });

    // Remove ctrl-pressed class when modifier is released
    document.addEventListener('keyup', (e) => {
      if (!lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) return;

      if (!e.ctrlKey && !e.metaKey) {
        lightboxOverlay.classList.remove('gh-enhancer-ctrl-pressed');
      }
    });

    // Also remove on blur (when window loses focus)
    window.addEventListener('blur', () => {
      lightboxOverlay.classList.remove('gh-enhancer-ctrl-pressed');
    });

    // Expose method to open lightbox with View Transition
    lightboxOverlay.openImage = (src, sourceImg) => {
      currentImageSrc = src;
      img.src = src;

      // Use View Transitions API if available
      if (document.startViewTransition && sourceImg) {
        // Assign name to source, start transition immediately
        sourceImg.style.viewTransitionName = 'lightbox-hero';

        document.startViewTransition(() => {
          sourceImg.style.viewTransitionName = '';
          img.style.viewTransitionName = 'lightbox-hero';
          lightboxOverlay.classList.add('gh-enhancer-lightbox-visible');
        });
      } else {
        lightboxOverlay.classList.add('gh-enhancer-lightbox-visible');
      }
    };
  }

  /**
   * Open image in lightbox
   */
  function openImageInLightbox(img) {
    // Get the actual image source (handle GitHub's camo proxy)
    let imageSrc = img.src;
    // If it's a camo URL, try to get the original from data-canonical-src
    if (img.dataset.canonicalSrc) {
      imageSrc = img.dataset.canonicalSrc;
    }

    // Pass source image for View Transition
    lightboxOverlay.setSourceImage(img);
    lightboxOverlay.openImage(imageSrc, img);
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

      // Handle click - open lightbox unless Ctrl/Cmd is pressed (to allow opening link)
      img.addEventListener('click', (e) => {
        // If Ctrl/Cmd is pressed, let the link open normally
        if (e.ctrlKey || e.metaKey) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        openImageInLightbox(img);
      });

      // Handle parent link clicks and keyboard navigation
      const parentLink = img.closest('a');
      if (parentLink) {
        // Store original href for Ctrl/Cmd + click
        const originalHref = parentLink.href;

        // Handle click on the link (for clicks that bubble up)
        parentLink.addEventListener('click', (e) => {
          // If Ctrl/Cmd is pressed, let the link open normally
          if (e.ctrlKey || e.metaKey) {
            return;
          }

          // If click is on the image or its container, open lightbox
          if (e.target === img || e.target.closest('img') === img) {
            e.preventDefault();
            e.stopPropagation();
            openImageInLightbox(img);
          }
        });

        // Handle keyboard navigation (Enter key)
        parentLink.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            // If Ctrl/Cmd is pressed, let the link open normally
            if (e.ctrlKey || e.metaKey) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            openImageInLightbox(img);
          }
        });

        // Add title hint for users
        parentLink.title = 'Click to view image • Ctrl/Cmd + click to open link';
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
   * GitHub Repo Link Hover Preview
   * Shows stars, description, language for GitHub repo links
   */
  const repoPreviewCache = {
    // In-memory cache for current session
    data: {},

    // Rate limit tracking
    requestCount: 0,
    requestWindowStart: Date.now(),

    // Get from localStorage with expiry check
    get(repoKey) {
      // Check memory first
      if (this.data[repoKey]) return this.data[repoKey];

      try {
        const cached = localStorage.getItem(`gh-enhancer-repo-${repoKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          // 24 hour expiry
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            this.data[repoKey] = parsed.data;
            return parsed.data;
          }
        }
      } catch (e) {}
      return null;
    },

    // Save to both memory and localStorage
    set(repoKey, data) {
      this.data[repoKey] = data;
      try {
        localStorage.setItem(`gh-enhancer-repo-${repoKey}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {}
    },

    // Check if we can make a request (60/hour limit)
    canRequest() {
      const now = Date.now();
      // Reset counter every hour
      if (now - this.requestWindowStart > 60 * 60 * 1000) {
        this.requestCount = 0;
        this.requestWindowStart = now;
      }
      // Leave buffer of 10 requests
      return this.requestCount < 50;
    },

    incrementRequests() {
      this.requestCount++;
    }
  };

  // Pending fetches to avoid duplicate requests
  const pendingFetches = {};

  async function fetchRepoData(owner, repo) {
    const repoKey = `${owner}/${repo}`;

    // Check cache first
    const cached = repoPreviewCache.get(repoKey);
    if (cached) return cached;

    // Check if already fetching
    if (pendingFetches[repoKey]) {
      return pendingFetches[repoKey];
    }

    // Check rate limit
    if (!repoPreviewCache.canRequest()) {
      return null;
    }

    // Fetch from GitHub API
    pendingFetches[repoKey] = (async () => {
      try {
        repoPreviewCache.incrementRequests();
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          // Cache 404s too to avoid refetching
          if (response.status === 404) {
            repoPreviewCache.set(repoKey, { notFound: true });
          }
          return null;
        }

        const data = await response.json();
        const repoData = {
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          topics: data.topics?.slice(0, 3) || [],
          isArchived: data.archived,
          isFork: data.fork,
          updatedAt: data.updated_at,
          owner: {
            avatar: data.owner.avatar_url,
            type: data.owner.type
          }
        };

        repoPreviewCache.set(repoKey, repoData);
        return repoData;
      } catch (e) {
        console.error('[GitHub Enhancer] Failed to fetch repo data:', e);
        return null;
      } finally {
        delete pendingFetches[repoKey];
      }
    })();

    return pendingFetches[repoKey];
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'recently';
  }

  function createRepoPreviewPopup(data, rect) {
    const popup = document.createElement('div');
    popup.className = 'gh-enhancer-repo-preview';

    const languageColors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'Java': '#b07219',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'C++': '#f34b7d',
      'C': '#555555',
      'Ruby': '#701516',
      'PHP': '#4F5D95',
      'Swift': '#F05138',
      'Kotlin': '#A97BFF',
      'Dart': '#00B4AB',
      'Vue': '#41b883',
      'CSS': '#563d7c',
      'HTML': '#e34c26',
      'Shell': '#89e051',
      'Scala': '#c22d40',
      'Elixir': '#6e4a7e'
    };

    const langColor = data.language ? (languageColors[data.language] || '#8b949e') : null;

    const [owner, repo] = data.name.split('/');
    const repoUrl = `https://github.com/${data.name}`;

    popup.innerHTML = `
      <div class="gh-enhancer-repo-preview-header">
        <a href="https://github.com/${owner}" class="gh-enhancer-repo-preview-avatar-link" title="${owner}">
          <img class="gh-enhancer-repo-preview-avatar" src="${data.owner.avatar}&s=32" alt="" width="16" height="16">
        </a>
        <a href="${repoUrl}" class="gh-enhancer-repo-preview-name">${data.name}</a>
        ${data.isArchived ? '<span class="gh-enhancer-repo-preview-badge gh-enhancer-repo-archived">Archived</span>' : ''}
        ${data.isFork ? '<span class="gh-enhancer-repo-preview-badge gh-enhancer-repo-fork">Fork</span>' : ''}
      </div>
      ${data.description ? `<p class="gh-enhancer-repo-preview-desc">${data.description}</p>` : ''}
      <div class="gh-enhancer-repo-preview-stats">
        <a href="${repoUrl}/stargazers" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link" title="Stars">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          ${formatNumber(data.stars)}
        </a>
        <a href="${repoUrl}/forks" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link" title="Forks">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
          </svg>
          ${formatNumber(data.forks)}
        </a>
        ${data.language ? `
          <a href="${repoUrl}/search?l=${encodeURIComponent(data.language.toLowerCase())}" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link gh-enhancer-repo-preview-lang" title="Search ${data.language} files">
            <span class="gh-enhancer-repo-preview-lang-dot" style="background: ${langColor}"></span>
            ${data.language}
          </a>
        ` : ''}
        <span class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-updated" title="Last updated">
          Updated ${timeAgo(data.updatedAt)}
        </span>
      </div>
      ${data.topics.length > 0 ? `
        <div class="gh-enhancer-repo-preview-topics">
          ${data.topics.map(t => `<a href="https://github.com/topics/${encodeURIComponent(t)}" class="gh-enhancer-repo-preview-topic">${t}</a>`).join('')}
        </div>
      ` : ''}
    `;

    document.body.appendChild(popup);

    // Position popup
    const popupRect = popup.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;

    // Keep within viewport
    if (left + popupRect.width > window.innerWidth - 16) {
      left = window.innerWidth - popupRect.width - 16;
    }
    if (left < 16) left = 16;

    // Show above if not enough space below
    if (top + popupRect.height > window.innerHeight + window.scrollY - 16) {
      top = rect.top + window.scrollY - popupRect.height - 8;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    return popup;
  }

  function addGitHubRepoLinkPreviews() {
    const readme = document.querySelector('.markdown-body');
    if (!readme) return;

    // Match GitHub repo links (not file paths, issues, PRs, etc.)
    const repoLinkPattern = /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/;

    const links = readme.querySelectorAll('a[href*="github.com"]');
    let currentPreview = null;
    let hoverTimeout = null;
    let leaveTimeout = null;

    links.forEach(link => {
      if (link.dataset.ghEnhancerRepoPreview) return;

      const href = link.getAttribute('href');
      const match = href?.match(repoLinkPattern);
      if (!match) return;

      const [, owner, repo] = match;

      // Skip if it's the current repo
      const currentPath = window.location.pathname;
      if (currentPath === `/${owner}/${repo}` || currentPath === `/${owner}/${repo}/`) return;

      link.dataset.ghEnhancerRepoPreview = 'true';
      link.classList.add('gh-enhancer-repo-link');

      link.addEventListener('mouseenter', async () => {
        clearTimeout(leaveTimeout);

        // Small delay before showing preview
        hoverTimeout = setTimeout(async () => {
          const data = await fetchRepoData(owner, repo);

          if (!data || data.notFound) return;

          // Remove existing preview
          if (currentPreview) {
            currentPreview.remove();
            currentPreview = null;
          }

          const rect = link.getBoundingClientRect();
          currentPreview = createRepoPreviewPopup(data, rect);

          // Keep preview open when hovering over it
          currentPreview.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
          });

          currentPreview.addEventListener('mouseleave', () => {
            leaveTimeout = setTimeout(() => {
              if (currentPreview) {
                currentPreview.remove();
                currentPreview = null;
              }
            }, 100);
          });
        }, 300);
      });

      link.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        leaveTimeout = setTimeout(() => {
          if (currentPreview) {
            currentPreview.remove();
            currentPreview = null;
          }
        }, 100);
      });
    });
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
    addGitHubRepoLinkPreviews();

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
    document.querySelectorAll('.gh-enhancer-repo-preview').forEach(el => el.remove());

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
