// Bosansko Blago - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Card name to index mapping
  const cardNames = ['fildzhan', 'fes', 'ibrik', 'bosanska-kuca', 'cilim', 'sargija', 'opanak', 'baklava', 'ljiljan'];

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

      const slide = card.closest('.swiper-slide');
      const isActive = slide.classList.contains('swiper-slide-active');

      // Only expand the active (top) card
      if (!isActive) return;

      expandCard(card);
    });
  });

  function expandCard(card) {
    // Get card content
    const image = card.querySelector('.card-image img');
    const title = card.querySelector('.card-title h2');
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

  function navigateToDeepLink() {
    const targetIndex = getCardIndexFromHash();

    if (targetIndex !== null && targetIndex > 0) {
      // Step through cards one by one with ease-in-out timing
      setTimeout(function() {
        let currentIndex = 0;
        const totalSteps = targetIndex;

        function easeInOutQuad(t) {
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        function stepToNext() {
          currentIndex++;

          // Calculate progress (0 to 1)
          const progress = currentIndex / totalSteps;

          // Eased progress for timing - inverted so slow at start/end, fast in middle
          const easedProgress = easeInOutQuad(progress);
          const prevEased = easeInOutQuad((currentIndex - 1) / totalSteps);
          const stepSpeed = easedProgress - prevEased;

          // Base delay inversely proportional to speed (slower = longer delay)
          // Range: 100ms (fastest in middle) to 200ms (slowest at start/end)
          const minDelay = 100;
          const maxDelay = 200;
          const delay = maxDelay - (stepSpeed * totalSteps * (maxDelay - minDelay));

          // Slide speed also varies - faster slides in middle
          const slideSpeed = 150 + (1 - stepSpeed * totalSteps) * 100;

          swiper.slideTo(currentIndex, slideSpeed);

          if (currentIndex < targetIndex) {
            setTimeout(stepToNext, delay);
          } else {
            // Final card - add visual feedback
            setTimeout(function() {
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
        history.replaceState(null, null, '#fildzhan');
      }
    }
  }, 100);

  // Listen for hash changes (browser back/forward)
  window.addEventListener('hashchange', function() {
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

  // Expose swiper instance for debugging
  window.bosnianTreasureSwiper = swiper;
});
