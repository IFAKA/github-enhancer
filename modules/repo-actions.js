// GitHub Enhancer - Repo Actions Module
// Moves repo action buttons (Star, Fork, Watch) to sidebar
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  /**
   * Process button to remove text labels but keep icons and counters
   * Adds title attribute for hover tooltip
   */
  function processActionButton(container) {
    const buttons = container.querySelectorAll('.BtnGroup-item, .btn, .Button, summary, button, a');

    buttons.forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      if (ariaLabel && !btn.getAttribute('title')) {
        btn.setAttribute('title', ariaLabel);
      }

      btn.querySelectorAll('span').forEach(span => {
        if (span.classList.contains('Counter') || span.querySelector('.Counter')) return;
        if (span.querySelector('svg, [class*="octicon"]')) return;
        if (span.className && span.className.includes('octicon')) return;

        const text = span.textContent?.trim();
        if (text && !btn.getAttribute('title')) {
          btn.setAttribute('title', text);
        }
        span.remove();
      });

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

    const details = container.querySelector('details');
    if (details) {
      const summary = details.querySelector('summary');
      if (summary) {
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

        summary.querySelectorAll('span').forEach(span => {
          if (span.classList.contains('Counter') || span.querySelector('.Counter')) return;
          if (span.querySelector('svg, [class*="octicon"]')) return;
          if (span.className && span.className.includes('octicon')) return;
          span.remove();
        });

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
    const sidebar = GH.utils.findSidebar();

    if (!detailsContainer || !sidebar) return;

    if (sidebar.querySelector('.gh-enhancer-repo-actions')) return;

    const actionsList = detailsContainer.querySelector('.pagehead-actions');
    if (!actionsList) return;

    const listItems = Array.from(actionsList.querySelectorAll(':scope > li'));

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

    const wrapper = document.createElement('div');
    wrapper.className = 'BorderGrid-row gh-enhancer-repo-actions';

    const cell = document.createElement('div');
    cell.className = 'BorderGrid-cell';

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'gh-enhancer-actions-container';

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

    const actionsObserver = new MutationObserver(() => {
      actionsContainer.querySelectorAll('[class*="prc-Button-ButtonBase"], [aria-label*="Watch"]').forEach(btn => {
        const ariaLabel = btn.getAttribute('aria-label');
        if (ariaLabel && !btn.getAttribute('title')) {
          const title = ariaLabel.split(':')[0] || ariaLabel;
          btn.setAttribute('title', title);
        }
      });
    });
    actionsObserver.observe(actionsContainer, {
      childList: true,
      subtree: true
    });

    actionsContainer.querySelectorAll('[class*="prc-Button-ButtonBase"], [aria-label*="Watch"]').forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      if (ariaLabel && !btn.getAttribute('title')) {
        const title = ariaLabel.split(':')[0] || ariaLabel;
        btn.setAttribute('title', title);
      }
    });

    const firstRow = sidebar.querySelector('.BorderGrid-row');
    if (firstRow) {
      sidebar.insertBefore(wrapper, firstRow);
    } else {
      sidebar.appendChild(wrapper);
    }

    const repoHeader = document.querySelector('#repository-container-header');
    if (repoHeader) {
      repoHeader.style.display = 'none';
    }

    const overviewBox = document.querySelector('[class*="OverviewContent-module__Box_1"]');
    if (overviewBox) {
      overviewBox.style.paddingTop = '0';
    }
  }

  function init() {
    moveRepoActionsToSidebar();
  }

  function reset() {
    const repoHeader = document.querySelector('#repository-container-header[style*="display: none"]');
    if (repoHeader) repoHeader.style.display = '';

    document.querySelectorAll('.gh-enhancer-repo-actions').forEach(el => el.remove());
  }

  GH.repoActions = { init, reset };
})();
