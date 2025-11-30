# GitHub Enhancer

A Chrome extension that enhances the GitHub repository experience with better README readability, image viewing, and UI improvements.

## Features

### Image Lightbox with View Transitions API

Click any image in a README to open it in a fullscreen lightbox with a beautiful **shared element transition** (hero animation).

**How it works:**

The lightbox uses the native [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions) to create a smooth morphing animation where the image appears to "fly" from its position in the README to the center of the screen.

```javascript
// 1. Give the source image a view-transition-name
sourceImg.style.viewTransitionName = 'lightbox-hero';

// 2. Start the view transition
document.startViewTransition(() => {
  // Transfer the name to the lightbox image
  sourceImg.style.viewTransitionName = '';
  lightboxImg.style.viewTransitionName = 'lightbox-hero';

  // Show the lightbox
  lightbox.classList.add('visible');
});
```

```css
/* Customize the transition animation */
::view-transition-old(lightbox-hero),
::view-transition-new(lightbox-hero) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  object-fit: contain;
}
```

**The magic:** By giving both the source and destination images the same `view-transition-name`, the browser automatically:
1. Captures the old element's position, size, and appearance
2. Captures the new element's position, size, and appearance
3. Animates between them with a smooth morph effect

**Lightbox controls:**
- Zoom in/out with buttons or `+`/`-` keys
- Pan by dragging when zoomed in
- Copy image to clipboard
- Download image
- Close with click outside, Escape, or close button

### Collapsible Code Blocks

Long code blocks (>40% of viewport height) are automatically collapsed with an "Expand" button showing how many lines are hidden.

### Table of Contents

A floating TOC panel on the right side showing all headings, with the current section highlighted as you scroll.

### Other Features

- **Anchor Link Preview**: Hover over internal `#section` links to see a preview
- **External Link Indicators**: External links show a small icon
- **Font Size Controls**: Adjust README text size from the sidebar (`+`/`-`/`0` keys)
- **Reading Time**: Estimated reading time shown in sidebar
- **Badge Tooltips**: Hover over shields.io badges for explanations
- **Clickable npm Imports**: Ctrl/Cmd+click on import statements to view packages on npm
- **Simplified Repo Actions**: Star/Watch/Fork buttons moved to sidebar
- **Collapsible File Tree**: Toggle the file list to focus on README

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Browser Support

- Chrome 111+ (required for View Transitions API)
- Edge 111+
- Opera 97+

## How View Transitions Work

The View Transitions API (formerly "Shared Element Transitions") was added to Chrome in version 111. It provides a simple way to create animated transitions between DOM states.

### Basic Usage

```javascript
// Wrap any DOM changes in startViewTransition
document.startViewTransition(() => {
  // Update DOM here
  element.classList.add('new-state');
});
```

### Shared Element Transitions

To animate an element moving between two positions:

1. **Before transition**: Give the element a unique `view-transition-name`
2. **During transition callback**: Transfer that name to the destination element
3. **The browser handles the rest**: It animates position, size, and opacity automatically

```javascript
// Source element (e.g., thumbnail)
thumbnail.style.viewTransitionName = 'my-image';

document.startViewTransition(() => {
  thumbnail.style.viewTransitionName = '';
  fullImage.style.viewTransitionName = 'my-image';
  showFullImage();
});
```

### Customizing Animations

Use the `::view-transition-old()` and `::view-transition-new()` pseudo-elements:

```css
::view-transition-old(my-image) {
  animation: fade-out 0.3s ease-out;
}

::view-transition-new(my-image) {
  animation: fade-in 0.3s ease-in;
}
```

### Resources

- [Chrome Docs: View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Smashing Magazine Tutorial](https://www.smashingmagazine.com/2023/12/view-transitions-api-ui-animations-part1/)

## License

MIT
