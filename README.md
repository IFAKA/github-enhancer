<p align="center">
  <img src="https://github.com/user-attachments/assets/8c38e888-3225-45ea-bb7e-eddf197aa8ed" alt="GitHub Enhancer Banner" width="100%">
</p>

# GitHub Enhancer

A Chrome extension that enhances the GitHub repository experience with better README readability, image viewing, and UI improvements.

## Preview

![GitHub Enhancer Preview](media/preview.png)

## Demo
<video src="https://github.com/user-attachments/assets/3bd3e22e-9713-41a5-98d5-7681440d0fb3" width="320" height="240" controls></video>
<video src="https://github.com/user-attachments/assets/f89f15cd-1a47-4c9f-b21a-b492b206ccc7" width="320" height="240" controls></video>
<video src="https://github.com/user-attachments/assets/4230c937-90b8-474a-81c2-cbbfd786a438" width="320" height="240" controls></video>
<video src="https://github.com/user-attachments/assets/0341746c-f6ec-4391-9182-aff69e1dc617" width="320" height="240" controls></video>


## Features

- **Image Lightbox** - Click images for fullscreen view with zoom, pan, copy, and download
- **Collapsible Code Blocks** - Long code blocks auto-collapse with expand button
- **Table of Contents** - Floating TOC panel with scroll tracking
- **Anchor Link Preview** - Hover over `#section` links for previews
- **External Link Indicators** - Visual markers on external links
- **Font Size Controls** - Adjust README text size (`+`/`-`/`0` keys)
- **Reading Time** - Estimated reading time in sidebar
- **Badge Tooltips** - Hover over shields.io badges for explanations
- **npm Import Links** - Ctrl/Cmd+click imports to view on npm
- **Simplified Repo Actions** - Star/Watch/Fork buttons in sidebar
- **Collapsible File Tree** - Toggle file list to focus on README
- **Repo Link Previews** - Hover over GitHub repo links to see stats

## Installation

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/github-enhancer.git
   cd github-enhancer
   ```

2. Load in Chrome:
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the extension folder

3. The extension will activate on any `github.com/*/*` page

### From Release

1. Download the latest release
2. Extract and load unpacked in Chrome

## Project Structure

```
github-enhancer/
├── manifest.json          # Extension manifest (v3)
├── content.js             # Main entry point - orchestrates modules
├── styles.css             # Base styles
├── icons/                 # Extension icons (16, 48, 128px)
└── modules/               # Feature modules
    ├── utils.js           # Shared utilities and state
    ├── repo-actions.js    # Star/Watch/Fork sidebar buttons
    ├── file-actions.js    # File action buttons
    ├── collapse-toggle.js # File tree collapse
    ├── section-indicator.js # Current section highlighting
    ├── import-linkify.js  # npm import links
    ├── toc-panel.js       # Table of contents
    ├── anchor-preview.js  # Anchor link previews
    ├── code-collapse.js   # Code block collapsing
    ├── lightbox.js        # Image lightbox
    ├── external-links.js  # External link indicators
    ├── font-controls.js   # Font size controls
    ├── reading-time.js    # Reading time calculator
    ├── repo-preview.js    # Repo link hover previews
    └── badge-tooltips.js  # Badge explanations
```

## Architecture

### Module System

Each feature is a self-contained module following this pattern:

```javascript
// modules/example.js
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  function init() {
    // Setup logic - called when page loads
  }

  function reset() {
    // Cleanup logic - called on SPA navigation
  }

  // Export to namespace
  GH.example = { init, reset };
})();
```

### Shared State

All modules share state via `window.GitHubEnhancer.state`:

```javascript
GH.state = {
  isProcessed: false,        // Prevents double-processing
  observer: null,            // MutationObserver instance
  currentSectionElement: null,
  tocPanel: null,
  lightboxOverlay: null,
  currentFontSize: 100
};
```

### Utilities (`modules/utils.js`)

Common helpers available to all modules:

| Function | Description |
|----------|-------------|
| `isRepoMainPage()` | Check if on a repo main page |
| `formatNumber(num)` | Format numbers (1000 → 1k) |
| `timeAgo(dateString)` | Relative time (2 days ago) |
| `findLatestCommitBox()` | Get commit box element |
| `findFileTable()` | Get file tree table |
| `findReadme()` | Get README `.markdown-body` |
| `findSidebar()` | Get sidebar element |

### Entry Point (`content.js`)

The main script handles:
1. **Initialization** - Calls all module `init()` functions
2. **SPA Navigation** - Detects URL changes via MutationObserver
3. **Cleanup** - Calls all module `reset()` functions on navigation

Navigation events handled:
- `turbo:load` - GitHub's Turbo navigation
- `pjax:end` - Legacy pjax navigation
- MutationObserver - Fallback for URL changes

## Adding a New Module

1. Create `modules/your-feature.js`:
   ```javascript
   (function() {
     'use strict';
     const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

     function init() {
       const readme = GH.utils.findReadme();
       if (!readme) return;
       // Your feature logic
     }

     function reset() {
       // Cleanup DOM elements, event listeners
     }

     GH.yourFeature = { init, reset };
   })();
   ```

2. Create `modules/your-feature.css` for styles (prefix classes with `gh-enhancer-`)

3. Register in `manifest.json`:
   ```json
   {
     "content_scripts": [{
       "js": [..., "modules/your-feature.js", "content.js"],
       "css": [..., "modules/your-feature.css"]
     }]
   }
   ```

4. Call from `content.js`:
   ```javascript
   // In enhance()
   GH.yourFeature.init();

   // In reset()
   GH.yourFeature.reset();
   ```

## CSS Conventions

- Prefix all classes with `gh-enhancer-` to avoid conflicts
- Use CSS custom properties for theming when possible
- Module styles go in their own `modules/*.css` file

## Debugging

Open DevTools Console and look for `[GitHub Enhancer]` logs:
```
[GitHub Enhancer] Page enhanced
```

Access the extension namespace:
```javascript
window.GitHubEnhancer        // Full namespace
GH.state                     // Shared state
GH.utils.isRepoMainPage()    // Utility check
```

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 111+ |
| Edge | 111+ |
| Opera | 97+ |

> View Transitions API required for lightbox animations

## Technical Notes

### View Transitions API

The lightbox uses the native [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions) for smooth image animations:

```javascript
// Assign transition name to source image
sourceImg.style.viewTransitionName = 'lightbox-hero';

// Start transition
document.startViewTransition(() => {
  sourceImg.style.viewTransitionName = '';
  lightboxImg.style.viewTransitionName = 'lightbox-hero';
  lightbox.classList.add('visible');
});
```

### GitHub SPA Handling

GitHub uses multiple navigation systems:
- **Turbo** - Modern navigation
- **pjax** - Legacy navigation

The extension handles both plus a MutationObserver fallback to ensure enhancements apply after any navigation.

## License

MIT
