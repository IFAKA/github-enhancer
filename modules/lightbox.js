// GitHub Enhancer - Lightbox Module
// Creates image lightbox with zoom/pan/download functionality
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  // Store event handlers for cleanup
  let documentHandlers = {
    mousemove: null,
    mouseup: null,
    keydown: null,
    keyup: null,
    blur: null
  };

  /**
   * Create image lightbox
   */
  function createLightbox() {
    if (GH.state.lightboxOverlay) return;

    GH.state.lightboxOverlay = document.createElement('div');
    GH.state.lightboxOverlay.className = 'gh-enhancer-lightbox';
    GH.state.lightboxOverlay.innerHTML = `
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

    document.body.appendChild(GH.state.lightboxOverlay);

    let currentZoom = 100;
    let currentImageSrc = '';
    const img = GH.state.lightboxOverlay.querySelector('.gh-enhancer-lightbox-image');
    const zoomLabel = GH.state.lightboxOverlay.querySelector('.gh-enhancer-lightbox-zoom');

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let hasDragged = false;
    let mouseDownTime = 0;

    img.addEventListener('mousedown', (e) => {
      mouseDownTime = Date.now();
      hasDragged = false;

      if (currentZoom <= 100) return;
      e.preventDefault();
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      img.style.cursor = 'grabbing';
    });

    documentHandlers.mousemove = (e) => {
      if (!isPanning) return;
      hasDragged = true;
      e.preventDefault();
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateImageTransform();
    };
    document.addEventListener('mousemove', documentHandlers.mousemove);

    documentHandlers.mouseup = () => {
      if (isPanning) {
        isPanning = false;
        img.style.cursor = '';
      }
    };
    document.addEventListener('mouseup', documentHandlers.mouseup);

    img.addEventListener('click', (e) => {
      if (hasDragged || Date.now() - mouseDownTime > 200) return;

      e.preventDefault();
      e.stopPropagation();

      img.classList.add('gh-enhancer-zooming');

      if (e.ctrlKey || e.metaKey) {
        currentZoom = Math.max(currentZoom - 25, 25);
        if (currentZoom <= 100) resetPan();
      } else {
        currentZoom = Math.min(currentZoom + 25, 300);
      }

      updateImageTransform();
      zoomLabel.textContent = `${currentZoom}%`;
      setTimeout(() => img.classList.remove('gh-enhancer-zooming'), 200);
    });

    function updateImageTransform() {
      img.style.transform = `scale(${currentZoom / 100}) translate(${translateX / (currentZoom / 100)}px, ${translateY / (currentZoom / 100)}px)`;
    }

    function resetPan() {
      translateX = 0;
      translateY = 0;
    }

    GH.state.lightboxOverlay.addEventListener('click', async (e) => {
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
            const response = await fetch(currentImageSrc);
            const blob = await response.blob();

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
                setTimeout(() => btn.classList.remove('gh-enhancer-lightbox-btn-success'), 1500);
              } catch (err) {
                await navigator.clipboard.writeText(currentImageSrc);
                btn.classList.add('gh-enhancer-lightbox-btn-success');
                setTimeout(() => btn.classList.remove('gh-enhancer-lightbox-btn-success'), 1500);
              }
            }, 'image/png');
          } catch (err) {
            try {
              await navigator.clipboard.writeText(currentImageSrc);
              btn.classList.add('gh-enhancer-lightbox-btn-success');
              setTimeout(() => btn.classList.remove('gh-enhancer-lightbox-btn-success'), 1500);
            } catch (e) {}
          }
          break;
        case 'download':
          btn.classList.add('gh-enhancer-lightbox-btn-downloading');
          try {
            const response = await fetch(currentImageSrc);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            const urlPath = new URL(currentImageSrc).pathname;
            const filename = urlPath.split('/').pop() || 'image.png';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

            setTimeout(() => btn.classList.remove('gh-enhancer-lightbox-btn-downloading'), 1000);
          } catch (err) {
            btn.classList.remove('gh-enhancer-lightbox-btn-downloading');
            window.open(currentImageSrc, '_blank');
          }
          break;
        case 'close':
          closeLightbox();
          break;
      }
    });

    let sourceImageRef = null;

    GH.state.lightboxOverlay.setSourceImage = (sourceImg) => {
      sourceImageRef = sourceImg;
    };

    function closeLightbox() {
      if (document.startViewTransition && sourceImageRef) {
        document.startViewTransition(() => {
          img.style.viewTransitionName = '';
          sourceImageRef.style.viewTransitionName = 'lightbox-hero';
          GH.state.lightboxOverlay.classList.remove('gh-enhancer-lightbox-visible');
        }).finished.then(() => {
          sourceImageRef.style.viewTransitionName = '';
          sourceImageRef = null;
          currentZoom = 100;
          resetPan();
          img.style.transform = '';
          img.style.cursor = 'zoom-in';
          zoomLabel.textContent = '100%';
        }).catch(() => {});
      } else {
        GH.state.lightboxOverlay.classList.remove('gh-enhancer-lightbox-visible');
        sourceImageRef = null;
        currentZoom = 100;
        resetPan();
        img.style.transform = '';
        img.style.cursor = 'zoom-in';
        zoomLabel.textContent = '100%';
      }
    }

    GH.state.lightboxOverlay.querySelector('.gh-enhancer-lightbox-backdrop').addEventListener('click', closeLightbox);

    documentHandlers.keydown = (e) => {
      if (!GH.state.lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) return;

      if (e.ctrlKey || e.metaKey) {
        GH.state.lightboxOverlay.classList.add('gh-enhancer-ctrl-pressed');
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
    };
    document.addEventListener('keydown', documentHandlers.keydown);

    documentHandlers.keyup = (e) => {
      if (!GH.state.lightboxOverlay.classList.contains('gh-enhancer-lightbox-visible')) return;

      if (!e.ctrlKey && !e.metaKey) {
        GH.state.lightboxOverlay.classList.remove('gh-enhancer-ctrl-pressed');
      }
    };
    document.addEventListener('keyup', documentHandlers.keyup);

    documentHandlers.blur = () => {
      GH.state.lightboxOverlay.classList.remove('gh-enhancer-ctrl-pressed');
    };
    window.addEventListener('blur', documentHandlers.blur);

    GH.state.lightboxOverlay.openImage = (src, sourceImg) => {
      currentImageSrc = src;
      img.src = src;

      if (document.startViewTransition && sourceImg) {
        sourceImg.style.viewTransitionName = 'lightbox-hero';

        document.startViewTransition(() => {
          sourceImg.style.viewTransitionName = '';
          img.style.viewTransitionName = 'lightbox-hero';
          GH.state.lightboxOverlay.classList.add('gh-enhancer-lightbox-visible');
        });
      } else {
        GH.state.lightboxOverlay.classList.add('gh-enhancer-lightbox-visible');
      }
    };
  }

  /**
   * Open image in lightbox
   */
  function openImageInLightbox(img) {
    let imageSrc = img.src;
    if (img.dataset.canonicalSrc) {
      imageSrc = img.dataset.canonicalSrc;
    }

    GH.state.lightboxOverlay.setSourceImage(img);
    GH.state.lightboxOverlay.openImage(imageSrc, img);
  }

  /**
   * Add click handlers to images for lightbox
   */
  function setupImageLightbox() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    createLightbox();

    const images = readme.querySelectorAll('img:not([alt*="badge"]):not([src*="shields.io"]):not([src*="img.shields"])');

    images.forEach(img => {
      if (img.dataset.ghEnhancerLightbox) return;
      img.dataset.ghEnhancerLightbox = 'true';

      if (img.naturalWidth < 100 && img.naturalHeight < 100) return;

      img.classList.add('gh-enhancer-lightbox-target');

      img.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) return;

        e.preventDefault();
        e.stopPropagation();
        openImageInLightbox(img);
      });

      const parentLink = img.closest('a');
      if (parentLink) {
        parentLink.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey) return;

          if (e.target === img || e.target.closest('img') === img) {
            e.preventDefault();
            e.stopPropagation();
            openImageInLightbox(img);
          }
        });

        parentLink.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey) return;

            e.preventDefault();
            e.stopPropagation();
            openImageInLightbox(img);
          }
        });

        parentLink.title = 'Click to view image • Ctrl/Cmd + click to open link';
      }
    });
  }

  function init() {
    setupImageLightbox();
  }

  function reset() {
    // Clean up document-level event listeners
    if (documentHandlers.mousemove) {
      document.removeEventListener('mousemove', documentHandlers.mousemove);
      documentHandlers.mousemove = null;
    }
    if (documentHandlers.mouseup) {
      document.removeEventListener('mouseup', documentHandlers.mouseup);
      documentHandlers.mouseup = null;
    }
    if (documentHandlers.keydown) {
      document.removeEventListener('keydown', documentHandlers.keydown);
      documentHandlers.keydown = null;
    }
    if (documentHandlers.keyup) {
      document.removeEventListener('keyup', documentHandlers.keyup);
      documentHandlers.keyup = null;
    }
    if (documentHandlers.blur) {
      window.removeEventListener('blur', documentHandlers.blur);
      documentHandlers.blur = null;
    }
    // Remove lightbox from DOM so it's recreated fresh
    if (GH.state.lightboxOverlay) {
      GH.state.lightboxOverlay.remove();
      GH.state.lightboxOverlay = null;
    }
  }

  GH.lightbox = { init, reset };
})();
