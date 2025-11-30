// GitHub Enhancer - Badge Tooltips Module
// Adds explanatory tooltips to badges
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

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

  /**
   * Add badge explanation tooltips
   */
  function addBadgeTooltips() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const badges = readme.querySelectorAll('img[src*="shields.io"], img[src*="img.shields"], img[alt*="badge"], img[alt*="status"]');

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

  function init() {
    addBadgeTooltips();
  }

  function reset() {
    // Badge tooltips don't need cleanup
  }

  GH.badgeTooltips = { init, reset };
})();
