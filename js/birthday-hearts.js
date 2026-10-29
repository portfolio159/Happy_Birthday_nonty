/**
 * Birthday Hearts Animation Engine — Happy Birthday Nonty 🎂♥️
 * 
 * Includes:
 * 1. Ambient Floating Hearts (Canvas Particle System)
 * 2. Magic Touch/Click Heart Bursts
 * 3. Interactive Celebration Heart Shower (Fountain)
 * 4. Floating Love Toast Messages
 */

(function () {
  'use strict';

  // Romantic Birthday Palette
  const PALETTE = [
    '#B84351', // Deep romantic rose
    '#D75A68', // Vibrant rose
    '#E2838C', // Soft blush
    '#DFA4AB', // Dusty rose
    '#F2BAC2', // Gentle petal
    '#FF6B81', // Coral pink
    '#E05666', // Crimson blush
  ];

  const LOVE_MESSAGES = [
    '💖 Happy Birthday Nonty! 🎂',
    '👑 For the sweetest heart in the world!',
    '✨ You make every single day brighter!',
    '💕 Celebrating the most special person!',
    '🌸 Endless love and smiles for you today!',
    '🎀 You deserve all the happiness, Nonty!',
  ];

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let animFrameId = null;
  let isTabActive = true;

  // Pre-compiled Path2D heart for maximum 60fps GPU performance
  const heartPath = new Path2D(
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
  );

  // Particle pools
  const ambientHearts = [];
  const burstHearts = [];
  const showerHearts = [];

  /**
   * Generates a random number in range [min, max]
   */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generates an ambient floating heart
   */
  function createAmbientHeart(initial = false) {
    const isMobile = window.innerWidth < 768;
    const size = rand(isMobile ? 10 : 14, isMobile ? 22 : 30);
    return {
      x: rand(0, width),
      y: initial ? rand(0, height) : height + size + rand(10, 80),
      size: size,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      alpha: rand(0.2, 0.65),
      speedY: rand(0.6, 1.6),
      swayAngle: rand(0, Math.PI * 2),
      swaySpeed: rand(0.015, 0.035),
      swayDistance: rand(0.4, 1.2),
      rotation: rand(-0.3, 0.3),
      rotSpeed: rand(-0.008, 0.008),
    };
  }

  /**
   * Spawns a burst of hearts from (x, y)
   */
  function spawnHeartBurst(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2.5, 6.5);
      const size = rand(10, 22);
      burstHearts.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(1, 2.5), // bias upward
        size: size,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 1,
        decay: rand(0.016, 0.026),
        rotation: rand(-0.5, 0.5),
        rotSpeed: rand(-0.06, 0.06),
        gravity: 0.12,
      });
    }
  }

  /**
   * Spawns a celebratory fountain shower of hearts across screen
   */
  function spawnCelebrationShower() {
    const count = window.innerWidth < 768 ? 45 : 75;
    for (let i = 0; i < count; i++) {
      const size = rand(16, 36);
      const startX = width * 0.5 + rand(-width * 0.4, width * 0.4);
      const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15); // fountain upward
      const speed = rand(7, 16);
      showerHearts.push({
        x: startX,
        y: height + rand(20, 150),
        vx: Math.cos(angle) * speed * 0.8,
        vy: Math.sin(angle) * speed,
        size: size,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: rand(0.85, 1),
        decay: rand(0.008, 0.016),
        rotation: rand(-1, 1),
        rotSpeed: rand(-0.05, 0.05),
        gravity: 0.22,
      });
    }
    showLoveToast();
  }

  /**
   * Displays a romantic floating toast message
   */
  let lastToastIndex = -1;
  function showLoveToast() {
    let idx;
    do {
      idx = Math.floor(Math.random() * LOVE_MESSAGES.length);
    } while (idx === lastToastIndex && LOVE_MESSAGES.length > 1);
    lastToastIndex = idx;

    const msg = LOVE_MESSAGES[idx];

    let toast = document.getElementById('heart-love-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'heart-love-toast';
      toast.className = 'heart-love-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span class="toast-heart-icon">💖</span> <span>${msg}</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth; // reflow
    toast.classList.add('show');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  /**
   * Draws a single heart on canvas using pre-compiled Path2D
   */
  function drawHeart(p) {
    if (p.alpha <= 0.01) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    const scale = p.size / 24;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // center on origin
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    ctx.fillStyle = p.color;
    ctx.fill(heartPath);
    ctx.restore();
  }

  /**
   * Main render and physics loop
   */
  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // 1. Update and draw ambient background hearts
    for (let i = 0; i < ambientHearts.length; i++) {
      const p = ambientHearts[i];
      p.y -= p.speedY;
      p.swayAngle += p.swaySpeed;
      p.x += Math.sin(p.swayAngle) * p.swayDistance;
      p.rotation += p.rotSpeed;

      // Wrap around to bottom
      if (p.y < -p.size) {
        ambientHearts[i] = createAmbientHeart(false);
      } else {
        drawHeart(p);
      }
    }

    // 2. Update and draw click burst hearts
    for (let i = burstHearts.length - 1; i >= 0; i--) {
      const p = burstHearts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > height + 50) {
        burstHearts.splice(i, 1);
      } else {
        drawHeart(p);
      }
    }

    // 3. Update and draw celebration shower hearts
    for (let i = showerHearts.length - 1; i >= 0; i--) {
      const p = showerHearts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > height + 100) {
        showerHearts.splice(i, 1);
      } else {
        drawHeart(p);
      }
    }

    animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Resizes canvas to match device pixels
   */
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Adjust target ambient pool size based on screen dimensions
    const targetCount = Math.floor(Math.min(38, Math.max(16, (width * height) / 40000)));
    while (ambientHearts.length < targetCount) {
      ambientHearts.push(createAmbientHeart(true));
    }
    if (ambientHearts.length > targetCount) {
      ambientHearts.length = targetCount;
    }
  }

  /**
   * Sets up interactive user event listeners
   */
  function setupInteractionListeners() {
    // Click & Touch Sparkles anywhere on the screen
    window.addEventListener(
      'click',
      (e) => {
        // Skip spawning if clicking inside a form input to avoid distraction
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        spawnHeartBurst(e.clientX, e.clientY, 8);
      },
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const touch = e.touches[0];
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        spawnHeartBurst(touch.clientX, touch.clientY, 6);
      },
      { passive: true }
    );

    // Subtle Throttled Cursor Heart Trail (Desktop only)
    if (window.matchMedia('(pointer: fine)').matches) {
      let lastMove = 0;
      window.addEventListener(
        'mousemove',
        (e) => {
          const now = Date.now();
          if (now - lastMove > 90) {
            lastMove = now;
            burstHearts.push({
              x: e.clientX,
              y: e.clientY,
              vx: rand(-0.6, 0.6),
              vy: rand(-1.4, -0.4),
              size: rand(9, 15),
              color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
              alpha: 0.75,
              decay: 0.022,
              rotation: rand(-0.3, 0.3),
              rotSpeed: rand(-0.02, 0.02),
              gravity: -0.01, // float softly up
            });
          }
        },
        { passive: true }
      );
    }

    // Attach shower trigger to "Accept Date" links in navbar and hero
    document.querySelectorAll('a[href="#rsvp"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        spawnCelebrationShower();
      });
    });

    // Attach shower trigger to the RSVP submit button
    const rsvpBtn = document.getElementById('rsvp-submit-btn');
    if (rsvpBtn) {
      rsvpBtn.addEventListener('click', () => {
        setTimeout(spawnCelebrationShower, 300);
      });
    }

    // Floating Love Button Widget
    createFloatingLoveButton();

    // Tab visibility handling (pause when tab hidden to save battery)
    document.addEventListener('visibilitychange', () => {
      isTabActive = document.visibilityState === 'visible';
      if (isTabActive && !animFrameId) {
        loop();
      } else if (!isTabActive && animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    });

    window.addEventListener('resize', resizeCanvas, { passive: true });
  }

  /**
   * Injects the floating "💖 Shower Love" button
   */
  function createFloatingLoveButton() {
    const btn = document.createElement('button');
    btn.id = 'floating-love-btn';
    btn.className = 'floating-love-btn';
    btn.setAttribute('aria-label', 'Shower Love on Nonty');
    btn.title = 'Send Love & Celebrate Nonty! 💖';
    btn.innerHTML = `
      <span class="floating-love-icon">💖</span>
      <span class="floating-love-text">Shower Love</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      spawnCelebrationShower();
      btn.classList.add('pop-burst');
      setTimeout(() => btn.classList.remove('pop-burst'), 400);
    });

    document.body.appendChild(btn);
  }

  /**
   * Initializes the hearts system
   */
  function init() {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.id = 'romantic-hearts-canvas';
    canvas.className = 'romantic-hearts-canvas';
    document.body.prepend(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();
    setupInteractionListeners();

    // Start loop
    loop();
  }

  // Expose global celebration trigger for other scripts
  window.celebrateHeartShower = spawnCelebrationShower;
  window.spawnHeartBurst = spawnHeartBurst;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
