// Bosansko Blago - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Card name to index mapping
  const cardNames = ['fildzan', 'fes', 'ibrik', 'bosanska-kuca', 'cilim', 'sargija', 'opanak', 'baklava', 'ljiljan'];

  // Parse deep link from URL hash
  function getCardIndexFromHash() {
    const hash = window.location.hash;
    if (!hash) return null;

    const hashValue = hash.slice(1).toLowerCase(); // Remove # and lowercase

    // Check if it's a card name
    const nameIndex = cardNames.indexOf(hashValue);
    if (nameIndex !== -1) {
      return nameIndex;
    }

    // Support legacy formats: #card-1, #1, #card1
    const match = hash.match(/^#(?:card-?)?(\d+)$/i);
    if (match) {
      const cardNumber = parseInt(match[1], 10);
      if (cardNumber >= 1 && cardNumber <= 9) {
        return cardNumber - 1;
      }
    }

    return null;
  }

  // Get initial slide index from URL or default to 0
  const deepLinkIndex = getCardIndexFromHash();

  // Initialize Swiper with cards effect (stacked deck style)
  const swiper = new Swiper('.swiper', {
    effect: 'cards',
    grabCursor: true,
    initialSlide: 0,

    // Cards effect configuration
    cardsEffect: {
      perSlideOffset: 8,
      perSlideRotate: 2,
      rotate: true,
      slideShadows: false,
    },

    // Speed of transition
    speed: 500,

    // Pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },

    // Keyboard control
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },

    // Accessibility
    a11y: {
      prevSlideMessage: 'Prethodna kartica',
      nextSlideMessage: 'Sljedeća kartica',
    },
  });

  // Track if we're swiping (to differentiate from click)
  let isSwiping = false;
  let startX = 0;
  let startY = 0;

  swiper.on('touchStart', function(swiper, event) {
    isSwiping = false;
    const touch = event.touches ? event.touches[0] : event;
    startX = touch.clientX;
    startY = touch.clientY;
  });

  swiper.on('touchMove', function(swiper, event) {
    const touch = event.touches ? event.touches[0] : event;
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    if (deltaX > 10 || deltaY > 10) {
      isSwiping = true;
    }
  });

  // Update URL hash when slide changes
  swiper.on('slideChange', function() {
    const currentSlide = swiper.slides[swiper.activeIndex];
    const cardName = currentSlide ? currentSlide.getAttribute('data-card') : cardNames[swiper.realIndex];
    const newHash = `#${cardName}`;

    // Update URL without triggering hashchange
    if (window.location.hash !== newHash) {
      history.replaceState(null, null, newHash);
    }

    // Reset pulse timer on slide change
    resetPulseTimer();
  });

  // Pulse animation after 30s of inactivity
  let pulseTimer = null;

  function startPulse() {
    const activeSlide = document.querySelector('.swiper-slide-active');
    if (activeSlide) {
      const card = activeSlide.querySelector('.card');
      if (card) {
        card.classList.add('pulsing');
      }
    }
  }

  function stopPulse() {
    document.querySelectorAll('.card.pulsing').forEach(function(card) {
      card.classList.remove('pulsing');
    });
  }

  function resetPulseTimer() {
    stopPulse();
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(startPulse, 5000);
  }

  // Start initial timer
  resetPulseTimer();

  // Reset timer on any card interaction
  document.querySelectorAll('.card').forEach(function(card) {
    card.addEventListener('click', resetPulseTimer);
  });

  // Reset timer on swipe
  swiper.on('touchStart', resetPulseTimer);

  // =====================
  // Full Screen Expansion
  // =====================

  const overlay = document.getElementById('card-overlay');
  const expandedCard = document.getElementById('expanded-card');
  const closeBtn = document.getElementById('close-expanded');

  // Store the source card rect for FLIP animation
  let sourceCardRect = null;
  let currentSourceCard = null;

  // Expand card on click (not swipe)
  document.querySelectorAll('.swiper-slide .card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      // Only expand if not swiping
      if (isSwiping) return;

      // Don't expand while QR scanning
      if (isCardFlipped || isQrScanning) return;

      const slide = card.closest('.swiper-slide');
      const isActive = slide.classList.contains('swiper-slide-active');

      // Only expand the active (top) card
      if (!isActive) return;

      expandCard(card);
    });
  });

  function expandCard(card) {
    // Get card content (from card-front)
    const cardFront = card.querySelector('.card-front');
    const image = cardFront ? cardFront.querySelector('.card-image img') : card.querySelector('.card-image img');
    const title = cardFront ? cardFront.querySelector('.card-title h2') : card.querySelector('.card-title h2');
    const description = card.getAttribute('data-description');

    const expandedImage = expandedCard.querySelector('.expanded-image img');
    const expandedTitle = expandedCard.querySelector('.expanded-content h2');
    const expandedDescription = expandedCard.querySelector('.expanded-content p');

    // Reset any previous state
    expandedCard.classList.add('content-hidden');
    expandedCard.classList.remove('swiping');
    expandedCard.classList.remove('swipe-start');
    overlay.classList.remove('animating');

    // Set content
    expandedImage.src = image.src;
    expandedImage.alt = image.alt;
    expandedTitle.textContent = title.textContent;
    expandedDescription.textContent = description;

    // Capture card position
    sourceCardRect = card.getBoundingClientRect();
    currentSourceCard = card;

    // Hide the source card while expanded
    currentSourceCard.style.visibility = 'hidden';

    // Set initial size and position (exactly matching the card)
    expandedCard.style.width = sourceCardRect.width + 'px';
    expandedCard.style.height = sourceCardRect.height + 'px';
    expandedCard.style.top = sourceCardRect.top + 'px';
    expandedCard.style.left = sourceCardRect.left + 'px';
    expandedCard.style.borderRadius = '1.5rem';
    expandedCard.style.transform = '';

    // Show overlay without animation class first
    overlay.classList.remove('animating');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');

    // Force reflow
    expandedCard.offsetHeight;

    // Add animation class and animate to full screen
    overlay.classList.add('animating');
    expandedCard.style.width = '100%';
    expandedCard.style.height = '100%';
    expandedCard.style.top = '0';
    expandedCard.style.left = '0';
    expandedCard.style.borderRadius = '0';

    // Fade in text after expansion completes
    setTimeout(function() {
      expandedCard.classList.remove('content-hidden');
    }, 350);

    // Disable swiper while expanded
    swiper.disable();
  }

  function closeExpandedCard() {
    // Hide text and keep small font during collapse
    expandedCard.classList.add('content-hidden');
    expandedCard.classList.add('collapsing');

    // Get current card position (may have changed due to swipe)
    if (currentSourceCard) {
      sourceCardRect = currentSourceCard.getBoundingClientRect();
    }

    if (sourceCardRect) {
      // Ensure animation class is on
      overlay.classList.add('animating');

      // Animate back to card size and position
      expandedCard.style.width = sourceCardRect.width + 'px';
      expandedCard.style.height = sourceCardRect.height + 'px';
      expandedCard.style.top = sourceCardRect.top + 'px';
      expandedCard.style.left = sourceCardRect.left + 'px';
      expandedCard.style.borderRadius = '1.5rem';
      expandedCard.style.transform = '';

      // Wait for animation to complete before hiding
      setTimeout(function() {
        overlay.classList.remove('active');
        overlay.classList.remove('animating');
        document.body.classList.remove('no-scroll');
        expandedCard.classList.remove('content-hidden');
        expandedCard.classList.remove('collapsing');

        // Show the source card again
        if (currentSourceCard) {
          currentSourceCard.style.visibility = '';
        }

        sourceCardRect = null;
        currentSourceCard = null;

        // Re-enable swiper
        swiper.enable();
      }, 350);
    } else {
      // Fallback: no animation
      overlay.classList.remove('active');
      overlay.classList.remove('animating');
      document.body.classList.remove('no-scroll');
      expandedCard.classList.remove('content-hidden');
      expandedCard.classList.remove('collapsing');

      // Show the source card again
      if (currentSourceCard) {
        currentSourceCard.style.visibility = '';
      }

      // Re-enable swiper
      swiper.enable();
    }
  }

  // Close on button click
  closeBtn.addEventListener('click', closeExpandedCard);

  // Close on overlay background click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeExpandedCard();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeExpandedCard();
    }
  });

  // =====================
  // Swipe to Dismiss
  // =====================

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeCurrentX = 0;
  let swipeCurrentY = 0;
  let swipeStartTime = 0;
  let isSwipingToDismiss = false;
  let isCompacted = false;
  let swipeRafId = null;
  let compactTimeoutId = null;

  expandedCard.addEventListener('touchstart', function(e) {
    // Don't start swipe if touching close button
    if (e.target.closest('.close-btn')) return;

    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeCurrentX = swipeStartX;
    swipeCurrentY = swipeStartY;
    swipeStartTime = Date.now();
    isSwipingToDismiss = false;
    isCompacted = false;
  }, { passive: true });

  expandedCard.addEventListener('touchmove', function(e) {
    if (swipeStartX === 0 && swipeStartY === 0) return;

    swipeCurrentX = e.touches[0].clientX;
    swipeCurrentY = e.touches[0].clientY;
    const deltaX = swipeCurrentX - swipeStartX;
    const deltaY = swipeCurrentY - swipeStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start swiping if moved more than 10px in any direction
    if (distance > 10) {
      if (!isSwipingToDismiss) {
        // First time entering swipe mode
        isSwipingToDismiss = true;
        expandedCard.classList.add('content-hidden');
        expandedCard.classList.add('swiping');

        // Schedule compact after delay (skip if quick flick)
        compactTimeoutId = setTimeout(function() {
          if (isSwipingToDismiss && !isCompacted && sourceCardRect) {
            isCompacted = true;
            expandedCard.classList.remove('swiping');
            expandedCard.classList.add('swipe-start');
            expandedCard.classList.add('compacted');

            // Compact to minimal card size (centered on screen + drag offset)
            const cardWidth = sourceCardRect.width;
            const cardHeight = sourceCardRect.height;
            const centerX = (window.innerWidth - cardWidth) / 2 + (swipeCurrentX - swipeStartX);
            const centerY = (window.innerHeight - cardHeight) / 2 + (swipeCurrentY - swipeStartY);

            expandedCard.style.width = cardWidth + 'px';
            expandedCard.style.height = cardHeight + 'px';
            expandedCard.style.left = centerX + 'px';
            expandedCard.style.top = centerY + 'px';
            expandedCard.style.borderRadius = '1.5rem';
            expandedCard.style.transform = '';

            // After compact animation, back to immediate response
            setTimeout(function() {
              expandedCard.classList.remove('swipe-start');
              expandedCard.classList.add('swiping');
            }, 200);
          }
        }, 150);
      }

      // Update position
      if (swipeRafId) cancelAnimationFrame(swipeRafId);
      swipeRafId = requestAnimationFrame(function() {
        if (isCompacted && sourceCardRect) {
          // Move compact card by drag offset
          const cardWidth = sourceCardRect.width;
          const cardHeight = sourceCardRect.height;
          const centerX = (window.innerWidth - cardWidth) / 2 + deltaX;
          const centerY = (window.innerHeight - cardHeight) / 2 + deltaY;
          expandedCard.style.left = centerX + 'px';
          expandedCard.style.top = centerY + 'px';
        } else {
          // Full screen card - use transform for position
          expandedCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
      });
    }
  }, { passive: true });

  expandedCard.addEventListener('touchend', function(e) {
    // Cancel any pending animation frame
    if (swipeRafId) {
      cancelAnimationFrame(swipeRafId);
      swipeRafId = null;
    }

    // Cancel pending compact timeout
    if (compactTimeoutId) {
      clearTimeout(compactTimeoutId);
      compactTimeoutId = null;
    }

    if (!isSwipingToDismiss) {
      swipeStartX = 0;
      swipeStartY = 0;
      return;
    }

    const deltaX = swipeCurrentX - swipeStartX;
    const deltaY = swipeCurrentY - swipeStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const deltaTime = Date.now() - swipeStartTime;
    const velocity = distance / deltaTime;

    expandedCard.classList.remove('swiping');
    expandedCard.classList.remove('swipe-start');
    expandedCard.classList.remove('compacted');

    // Close if dragged far enough (120px) or fast enough (velocity > 0.4)
    if (distance > 120 || velocity > 0.4) {
      // Animate back to card position (reuse close logic)
      closeExpandedCard();
    } else {
      // Snap back to full screen with bounce
      overlay.classList.add('animating');
      expandedCard.style.width = '100%';
      expandedCard.style.height = '100%';
      expandedCard.style.top = '0';
      expandedCard.style.left = '0';
      expandedCard.style.transform = '';
      expandedCard.style.borderRadius = '0';

      // Restore text after snap back animation
      setTimeout(function() {
        expandedCard.classList.remove('content-hidden');
      }, 350);
    }

    swipeStartX = 0;
    swipeStartY = 0;
    swipeCurrentX = 0;
    swipeCurrentY = 0;
    isSwipingToDismiss = false;
    isCompacted = false;
  });

  // =====================
  // Deep Link Navigation
  // =====================

  let isNavigating = false;

  function navigateToDeepLink(customStartIndex) {
    const targetIndex = getCardIndexFromHash();
    if (targetIndex === null) return;

    // Prevent concurrent navigation animations
    if (isNavigating) return;

    // Use provided startIndex or default to 0 (for page load)
    const startIndex = typeof customStartIndex === 'number' ? customStartIndex : 0;

    // If already at target, just pulse
    if (startIndex === targetIndex) {
      const activeSlide = swiper.slides[swiper.activeIndex];
      if (activeSlide) {
        const card = activeSlide.querySelector('.card');
        if (card) {
          card.classList.add('deep-linked');
          setTimeout(function() {
            card.classList.remove('deep-linked');
          }, 1800);
        }
      }
      return;
    }

    // Calculate direction and steps
    const direction = targetIndex > startIndex ? 1 : -1;
    const totalSteps = Math.abs(targetIndex - startIndex);

    // Skip animation for page load from 0 if target is 0
    if (totalSteps === 0) return;

    isNavigating = true;

    // Step through cards one by one with ease-in-out timing
    setTimeout(function() {
      let currentIndex = startIndex;
      let stepCount = 0;

      function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      }

      function stepToNext() {
        currentIndex += direction;
        stepCount++;

        // Calculate progress (0 to 1)
        const progress = stepCount / totalSteps;

        // Eased progress for timing - inverted so slow at start/end, fast in middle
        const easedProgress = easeInOutQuad(progress);
        const prevEased = easeInOutQuad((stepCount - 1) / totalSteps);
        const stepSpeed = easedProgress - prevEased;

        // Base delay inversely proportional to speed (slower = longer delay)
        // Range: 100ms (fastest in middle) to 200ms (slowest at start/end)
        const minDelay = 100;
        const maxDelay = 200;
        const delay = maxDelay - (stepSpeed * totalSteps * (maxDelay - minDelay));

        // Slide speed also varies - faster slides in middle
        const slideSpeed = 150 + (1 - stepSpeed * totalSteps) * 100;

        swiper.slideTo(currentIndex, slideSpeed);

        if (currentIndex !== targetIndex) {
          setTimeout(stepToNext, delay);
        } else {
          // Final card - add visual feedback and release lock
          setTimeout(function() {
            isNavigating = false;
            const activeSlide = swiper.slides[swiper.activeIndex];
            if (activeSlide) {
              const card = activeSlide.querySelector('.card');
              if (card) {
                card.classList.add('deep-linked');
                setTimeout(function() {
                  card.classList.remove('deep-linked');
                }, 1800);
              }
            }
          }, 200);
        }
      }

      stepToNext();
    }, 300);
  }

  // Add loaded class for entrance animation
  setTimeout(function() {
    document.querySelector('.swiper').classList.add('loaded');

    // Navigate to deep link after entrance animation
    if (deepLinkIndex !== null) {
      navigateToDeepLink();
    } else {
      // Set initial hash if not present
      if (!window.location.hash) {
        history.replaceState(null, null, '#fildzan');
      }
    }
  }, 100);

  // Listen for hash changes (browser back/forward)
  window.addEventListener('hashchange', function() {
    if (isNavigating) return; // Don't interfere with ongoing animation
    const targetIndex = getCardIndexFromHash();
    if (targetIndex !== null) {
      swiper.slideTo(targetIndex, 400);
    }
  });

  // =====================
  // Pagination Drag Scrubber
  // =====================

  const pagination = document.querySelector('.swiper-pagination');
  let isDraggingPagination = false;

  function getSlideIndexFromX(clientX) {
    const bullets = pagination.querySelectorAll('.swiper-pagination-bullet');
    if (!bullets.length) return 0;

    const rect = pagination.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const relativeX = clientX - centerX;

    // Sensitivity multiplier - smaller number = less drag needed
    const sensitivity = 0.5;
    const effectiveWidth = rect.width * sensitivity;

    // Map position to slide index
    const normalized = (relativeX / effectiveWidth) + 0.5;
    const index = Math.floor(normalized * bullets.length);
    return Math.max(0, Math.min(index, bullets.length - 1));
  }

  function handlePaginationDrag(clientX) {
    const index = getSlideIndexFromX(clientX);
    if (index !== swiper.activeIndex) {
      swiper.slideTo(index, 50);
    }
  }

  // Touch events
  pagination.addEventListener('touchstart', function(e) {
    isDraggingPagination = true;
    handlePaginationDrag(e.touches[0].clientX);
  }, { passive: true });

  pagination.addEventListener('touchmove', function(e) {
    if (isDraggingPagination) {
      handlePaginationDrag(e.touches[0].clientX);
    }
  }, { passive: true });

  pagination.addEventListener('touchend', function() {
    isDraggingPagination = false;
  });

  // Mouse events
  pagination.addEventListener('mousedown', function(e) {
    isDraggingPagination = true;
    handlePaginationDrag(e.clientX);
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (isDraggingPagination) {
      handlePaginationDrag(e.clientX);
    }
  });

  document.addEventListener('mouseup', function() {
    isDraggingPagination = false;
  });

  // =====================
  // QR Code Scanner (Flip Card)
  // =====================

  const qrScannerBtn = document.getElementById('qr-scanner-btn');
  const qrScannerContainer = document.getElementById('qr-scanner-container');
  const qrStatus = document.getElementById('qr-status');
  let html5QrCode = null;
  let isQrScanning = false;
  let isCardFlipped = false;
  let activeFlippedCard = null;
  let isRequestingPermission = false; // Prevent click-outside during permission dialog

  // Valid card names for QR validation
  const validCardNames = new Set(cardNames);

  function extractHashFromUrl(url) {
    try {
      // Parse the URL to extract hash
      const urlObj = new URL(url);
      const hash = urlObj.hash;

      if (!hash || hash.length <= 1) return null;

      // Remove # and lowercase
      const cardName = hash.slice(1).toLowerCase();

      // Validate it's a known card name
      if (validCardNames.has(cardName)) {
        return cardName;
      }

      return null;
    } catch (e) {
      // If URL parsing fails, try direct hash extraction
      const hashMatch = url.match(/#([a-zA-Z-]+)$/);
      if (hashMatch) {
        const cardName = hashMatch[1].toLowerCase();
        if (validCardNames.has(cardName)) {
          return cardName;
        }
      }
      return null;
    }
  }

  function showQrStatus(message, type) {
    if (!qrStatus) return;
    qrStatus.textContent = message;
    qrStatus.className = 'qr-status' + (type ? ' ' + type : '');
  }

  function flipCardToScanner() {
    if (isCardFlipped || isQrScanning || isRequestingPermission) {
      return;
    }

    const activeSlide = swiper.slides[swiper.activeIndex];
    if (!activeSlide) return;

    const card = activeSlide.querySelector('.card');
    if (!card) return;

    const cardBack = card.querySelector('.card-back');
    if (!cardBack) return;

    // Move scanner container into card back
    if (qrScannerContainer) {
      cardBack.appendChild(qrScannerContainer);
    }

    // Flip the card
    card.classList.add('flipped');
    isCardFlipped = true;
    activeFlippedCard = card;
    document.body.classList.add('scanning');

    // Disable swiper while flipped
    swiper.disable();

    // Wait for flip animation to complete, then start scanner
    setTimeout(function() {
      startScanner();
    }, 350);
  }

  function startScanner() {
    showQrStatus('Usmjerite kameru prema QR kodu...');

    // Initialize scanner if not already
    if (!html5QrCode && typeof Html5Qrcode !== 'undefined') {
      html5QrCode = new Html5Qrcode('qr-reader');
    }

    if (!html5QrCode) {
      showQrStatus('Skener nije dostupan.', 'error');
      flipCardBack();
      return;
    }

    var config = {
      fps: 10,
      qrbox: { width: 180, height: 180 },
      disableFlip: false
    };

    // Set flag to prevent click-outside during permission dialog
    isRequestingPermission = true;

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanFailure
    ).then(function() {
      isQrScanning = true;
      isRequestingPermission = false;
    }).catch(function(err) {
      console.error('QR Scanner error:', err);
      isRequestingPermission = false;
      showQrStatus('Kamera nije dozvoljena.', 'error');
      // Flip back if camera permission denied
      setTimeout(function() {
        flipCardBack();
      }, 1500);
    });
  }

  function stopScanner() {
    if (html5QrCode && isQrScanning) {
      html5QrCode.stop().then(function() {
        isQrScanning = false;
      }).catch(function(err) {
        console.error('Error stopping scanner:', err);
        isQrScanning = false;
      });
    }
    showQrStatus('');
  }

  function flipCardBack() {
    if (!isCardFlipped) return;

    stopScanner();

    // Move scanner container back to body
    if (qrScannerContainer) {
      document.body.appendChild(qrScannerContainer);
    }

    // Flip card back
    if (activeFlippedCard) {
      activeFlippedCard.classList.remove('flipped');
    }
    document.body.classList.remove('scanning');

    // Reset state immediately
    isCardFlipped = false;
    activeFlippedCard = null;

    // Re-enable swiper after flip animation
    setTimeout(function() {
      swiper.enable();
    }, 350);
  }

  function onScanSuccess(decodedText) {
    // Extract card name from scanned URL
    var cardName = extractHashFromUrl(decodedText);

    if (cardName) {
      // Capitalize first letter for display
      var displayName = cardName.charAt(0).toUpperCase() + cardName.slice(1);
      displayName = displayName.replace('-', ' ');
      showQrStatus('Pronađeno: ' + displayName, 'success');

      // Vibrate for feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      // Flip card back and navigate after animation
      setTimeout(function() {
        flipCardBack();

        // Wait for flip animation, then navigate
        setTimeout(function() {
          // Update URL without triggering hashchange event
          history.replaceState(null, null, '#' + cardName);

          // Navigate from current position using unified navigation function
          navigateToDeepLink(swiper.activeIndex);
        }, 500);
      }, 400);
    } else {
      showQrStatus('Nevažeći QR kod. Skenirajte Bosansko Blago QR kod.', 'error');
    }
  }

  function onScanFailure(error) {
    // Ignore scan failures (no QR code found yet)
  }

  // Event Listeners
  if (qrScannerBtn) {
    qrScannerBtn.addEventListener('click', flipCardToScanner);
  }

  // Click outside flipped card to flip back
  document.addEventListener('click', function(e) {
    if (!isCardFlipped || isRequestingPermission) return;

    // Ignore clicks on the QR button (including its SVG icon)
    if (qrScannerBtn && qrScannerBtn.contains(e.target)) {
      return;
    }

    // Check if click is outside the flipped card
    if (activeFlippedCard && !activeFlippedCard.contains(e.target)) {
      flipCardBack();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isCardFlipped) {
      flipCardBack();
    }
  });

  // Expose swiper instance for debugging
  window.bosnianTreasureSwiper = swiper;
});
