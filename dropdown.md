⏺ Here's the solution to move a GitHub button with a dropdown menu:

  Steps to Move a Button with Dropdown

  1. In JavaScript - Move the entire container (not just the button)

  // Find the button
  const button = document.querySelector('[aria-label="Add file"]');

  // Get the parent container that includes BOTH button AND overlay
  const container = button.closest('div');

  // Add a class for styling
  container.classList.add('gh-enhancer-add-file-container');

  // Move the entire container to new location
  targetElement.appendChild(container);

  // Optional: add custom styling class to button
  button.classList.add('gh-enhancer-add-file');

  Key: Use .closest('div') to get the parent that contains both the button and its dropdown overlay. Moving just the button breaks the dropdown positioning.

  2. In CSS - Allow overflow on ALL parent containers

  /* The moved container */
  .gh-enhancer-add-file-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  /* CRITICAL: Set overflow visible on ALL ancestors */
  [data-hpc="true"],
  [data-hpc="true"] table,
  [data-hpc="true"] tbody,
  [data-hpc="true"] tr,
  [data-hpc="true"] td,
  [class*="LatestCommit-module__Box"],
  [class*="LatestCommit-module__Box"] > div {
    overflow: visible !important;
  }

  /* Ensure dropdown escapes and has high z-index */
  .gh-enhancer-add-file-container > div {
    position: absolute !important;
    z-index: 1000 !important;
  }

  Key: The dropdown uses --top and --left CSS variables for positioning relative to its button. If any parent has overflow: hidden, it clips the dropdown.

  Summary

  1. Move the container (button + overlay), not just the button
  2. Set overflow: visible on every parent element from body down to the container
  3. Use high z-index on the overlay