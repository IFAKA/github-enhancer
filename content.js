// GitHub Enhancer - Content Script (Main Entry Point)
// Orchestrates all feature modules

(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  let observer = null;

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
   * Setup mutation observer for SPA navigation
   */
  function setupObserver() {
    if (observer) return;

    let lastUrl = location.href;

    observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        reset();
        setTimeout(enhance, 500);
      } else if (!GH.state.isProcessed) {
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

    // Handle GitHub's Turbo navigation
    document.addEventListener('turbo:load', () => {
      reset();
      setTimeout(enhance, 100);
    });

    // Handle pjax navigation
    document.addEventListener('pjax:end', () => {
      reset();
      setTimeout(enhance, 100);
    });
  }

  init();
})();
