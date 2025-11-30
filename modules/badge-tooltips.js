// GitHub Enhancer - Badge Tooltips Module
// Adds explanatory tooltips to badges
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  // Badge explanations lookup - keys are group indices from combined regex
  const badgeExplanations = [
    'Build Status: Shows if automated tests/CI pipeline is passing',      // build|ci|test|workflow
    'Code Coverage: Percentage of code covered by tests',                  // coverage|codecov|coveralls
    'npm Version: Current published version on npm registry',              // npm.*v|version
    'Downloads: Number of times this package has been downloaded',         // downloads
    'License: The open source license this project uses',                  // license
    'Community Chat: Join the community chat for support',                 // discord|chat|slack
    'Bundle Size: Minified/gzipped size when added to your project',      // bundle.*size|size
    'Dependencies: Status of project dependencies',                        // dependencies|deps
    'GitHub Stars: Popularity indicator on GitHub',                        // stars|github
    'TypeScript: This package includes TypeScript type definitions'        // typescript|types
  ];

  // Single combined regex with capturing groups - compiled once
  const badgePattern = /(build|ci|test|workflow)|(coverage|codecov|coveralls)|(npm.*v|version)|(downloads)|(license)|(discord|chat|slack)|(bundle.*size|size)|(dependencies|deps)|(stars|github)|(typescript|types)/i;

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

      const match = combined.match(badgePattern);
      if (match) {
        // Find which group matched (index 1-10, skip full match at 0)
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            badge.classList.add('gh-enhancer-badge');
            badge.title = badgeExplanations[i - 1];
            break;
          }
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
