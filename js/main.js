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
  });

  // =====================
  // Full Screen Expansion
  // =====================

  const overlay = document.getElementById('card-overlay');
  const expandedCard = document.getElementById('expanded-card');
  const closeBtn = document.getElementById('close-expanded');

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

    expandedImage.src = image.src;
    expandedImage.alt = image.alt;
    expandedTitle.textContent = title.textContent;
    expandedDescription.textContent = description;

    // Show overlay
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');

    // Disable swiper while expanded
    swiper.disable();
  }

  function closeExpandedCard() {
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');

    // Re-enable swiper
    swiper.enable();
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
  // Deep Link Navigation
  // =====================

  function navigateToDeepLink() {
    const targetIndex = getCardIndexFromHash();

    if (targetIndex !== null) {
      // Small delay for visual effect when coming from QR code
      setTimeout(function() {
        swiper.slideTo(targetIndex, 600);

        // Add visual feedback to the target card
        setTimeout(function() {
          const activeSlide = swiper.slides[swiper.activeIndex];
          if (activeSlide) {
            const card = activeSlide.querySelector('.card');
            if (card) {
              card.classList.add('deep-linked');
              setTimeout(function() {
                card.classList.remove('deep-linked');
              }, 800);
            }
          }
        }, 650);
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

  // Expose swiper instance for debugging
  window.bosnianTreasureSwiper = swiper;
});
