// GitHub Enhancer - Content Script (Main Entry Point)
// Orchestrates all feature modules

(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  let observer = null;
  let lastUrl = location.href;
  let enhanceTimeout = null;
  let isNavigating = false;

  /**
   * Main enhance function - calls all module init functions
   */
  function enhance() {
    if (GH.state.isProcessed) return;
    if (!GH.utils.isRepoMainPage()) return;

    GH.state.isProcessed = true;

    // Core repo page enhancements
    GH.repoActions.init();
    GH.fileActions.init();
    GH.collapseToggle.init();
    GH.sectionIndicator.init();
    GH.importLinkify.init();

    // README enhancements
    GH.tocPanel.init();
    GH.anchorPreview.init();
    GH.codeCollapse.init();
    GH.lightbox.init();
    GH.externalLinks.init();
    GH.fontControls.init();
    GH.readingTime.init();
    GH.badgeTooltips.init();
    GH.repoPreview.init();

    console.log('[GitHub Enhancer] Page enhanced');
  }

  /**
   * Reset for SPA navigation - calls all module reset functions
   */
  function reset() {
    GH.state.isProcessed = false;
    GH.state.currentSectionElement = null;

    // Clear cached DOM elements
    GH.utils.clearElementCache();

    // Restore hidden elements
    const repoHeader = document.querySelector('#repository-container-header[style*="display: none"]');
    if (repoHeader) repoHeader.style.display = '';

    // Call all module reset functions
    GH.repoActions.reset();
    GH.fileActions.reset();
    GH.sectionIndicator.reset();
    GH.tocPanel.reset();
    GH.anchorPreview.reset();
    GH.codeCollapse.reset();
    GH.externalLinks.reset();
    GH.fontControls.reset();
    GH.readingTime.reset();
    GH.repoPreview.reset();
  }

  /**
   * Schedule enhancement with debouncing
   * Waits for DOM to settle before enhancing
   */
  function scheduleEnhance(delay = 50) {
    if (enhanceTimeout) {
      clearTimeout(enhanceTimeout);
    }
    enhanceTimeout = setTimeout(() => {
      enhanceTimeout = null;
      enhance();
    }, delay);
  }

  /**
   * Handle navigation - reset and re-enhance
   */
  function handleNavigation() {
    if (isNavigating) return;
    isNavigating = true;

    reset();

    // Wait for DOM to be ready, then enhance
    // Use requestAnimationFrame to wait for render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isNavigating = false;
        scheduleEnhance(100);
      });
    });
  }

  /**
   * Check if URL changed and handle it
   */
  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      handleNavigation();
      return true;
    }
    return false;
  }

  /**
   * Setup mutation observer for SPA navigation
   * Watches for content container changes as a reliable signal
   */
  function setupObserver() {
    if (observer) return;

    // Debounce mutations to avoid excessive processing
    let mutationTimeout = null;

    observer = new MutationObserver((mutations) => {
      // Check for URL change first
      if (checkUrlChange()) return;

      // If not processed yet, try to enhance
      if (!GH.state.isProcessed) {
        if (mutationTimeout) clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
          mutationTimeout = null;
          enhance();
        }, 100);
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
    // Initial enhancement
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => scheduleEnhance(0));
    } else {
      scheduleEnhance(0);
    }

    setupObserver();

    // Handle GitHub's Turbo navigation (multiple events for reliability)
    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);
    document.addEventListener('turbo:frame-render', handleNavigation);

    // Handle turbo:before-render to reset before new content
    document.addEventListener('turbo:before-render', () => {
      reset();
    });

    // Handle pjax navigation (legacy, but still used in some places)
    document.addEventListener('pjax:end', handleNavigation);

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
      // Small delay to let the page update
      setTimeout(() => {
        checkUrlChange();
        if (!GH.state.isProcessed) {
          handleNavigation();
        }
      }, 50);
    });

    // Intercept pushState and replaceState for immediate detection
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => checkUrlChange(), 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => checkUrlChange(), 0);
    };
  }

  init();
})();
