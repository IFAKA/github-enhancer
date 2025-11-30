// GitHub Enhancer - Shared Utilities
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  // Shared state across all modules
  GH.state = {
    isProcessed: false,
    observer: null,
    currentSectionElement: null,
    tocPanel: null,
    lightboxOverlay: null,
    currentFontSize: 100,
    // Cached DOM elements (cleared on navigation)
    cachedElements: {
      readme: null,
      sidebar: null,
      fileTable: null,
      latestCommitBox: null
    }
  };

  /**
   * Clear cached DOM elements (call on navigation)
   */
  function clearElementCache() {
    GH.state.cachedElements.readme = null;
    GH.state.cachedElements.sidebar = null;
    GH.state.cachedElements.fileTable = null;
    GH.state.cachedElements.latestCommitBox = null;
  }

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
   * Format large numbers (e.g., 1000 -> 1k, 1000000 -> 1m)
   */
  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  }

  /**
   * Convert date to relative time string (e.g., "2 days ago")
   */
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

  /**
   * Find the LatestCommit box element (cached)
   */
  function findLatestCommitBox() {
    if (!GH.state.cachedElements.latestCommitBox) {
      GH.state.cachedElements.latestCommitBox = document.querySelector('[class*="LatestCommit-module__Box"]');
    }
    return GH.state.cachedElements.latestCommitBox;
  }

  /**
   * Find the file tree table (cached)
   */
  function findFileTable() {
    if (!GH.state.cachedElements.fileTable) {
      GH.state.cachedElements.fileTable = document.querySelector('table[aria-labelledby="folders-and-files"]') ||
             document.querySelector('[data-hpc="true"] table');
    }
    return GH.state.cachedElements.fileTable;
  }

  /**
   * Find the README markdown body (cached)
   */
  function findReadme() {
    if (!GH.state.cachedElements.readme) {
      GH.state.cachedElements.readme = document.querySelector('.markdown-body');
    }
    return GH.state.cachedElements.readme;
  }

  /**
   * Find the sidebar element (cached)
   */
  function findSidebar() {
    if (!GH.state.cachedElements.sidebar) {
      GH.state.cachedElements.sidebar = document.querySelector('.Layout-sidebar .BorderGrid.about-margin') ||
             document.querySelector('.Layout-sidebar .BorderGrid');
    }
    return GH.state.cachedElements.sidebar;
  }

  // Export utilities
  GH.utils = {
    isRepoMainPage,
    formatNumber,
    timeAgo,
    findLatestCommitBox,
    findFileTable,
    findReadme,
    findSidebar,
    clearElementCache
  };
})();
