/* =========================================================
   Hrishikesh Kini — Fluid Cursor & Interactive Animation Engine
   - Luminous ember particle trail that reacts organically to cursor velocity
   - Specular 3D tilt & cursor spotlight on cards & project showcases
   - Subtle magnetic pull on interactive buttons & nav elements
   - 60fps high performance with zero-allocation particle pools
   - Disabled on prefers-reduced-motion and touch screens
   ========================================================= */

(function () {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch =
    window.matchMedia && window.matchMedia("(hover: none)").matches;

  if (prefersReducedMotion || isTouch) return;

  /* =========================================================
     1. FLUID EMBER PARTICLE CANVAS TRAIL
     ========================================================= */
  let canvas = document.getElementById("fluid-cursor-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "fluid-cursor-canvas";
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener(
    "resize",
    function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    },
    { passive: true }
  );

  const MAX_PARTICLES = 50;
  const particles = [];
  let pIndex = 0;

  // Pre-allocate particle objects
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      alpha: 0,
      decay: 0,
      color: "#ff8f40",
      active: false,
    });
  }

  let lastX = 0;
  let lastY = 0;
  let isMoving = false;
  let idleTimer = null;

  function getThemeColors() {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      return ["#c2410c", "#ea580c", "#f97316", "#d97706"];
    }
    return ["#ff8f40", "#ffab5e", "#ff6b2b", "#ffc480"];
  }

  function spawnParticle(x, y, vx, vy) {
    const p = particles[pIndex];
    pIndex = (pIndex + 1) % MAX_PARTICLES;

    const colors = getThemeColors();
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.x = x + (Math.random() - 0.5) * 8;
    p.y = y + (Math.random() - 0.5) * 8;

    // Fluid spread based on cursor velocity
    const speed = Math.hypot(vx, vy);
    const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.2;
    const force = Math.min(speed * 0.12, 2.2) + Math.random() * 0.8;

    p.vx = -Math.cos(angle) * force + (Math.random() - 0.5) * 0.5;
    p.vy = -Math.sin(angle) * force + (Math.random() - 0.5) * 0.5;
    p.radius = Math.min(18 + speed * 0.35, 34);
    p.alpha = 0.55;
    p.decay = 0.022 + Math.random() * 0.018;
    p.color = color;
    p.active = true;
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      const vx = e.clientX - lastX;
      const vy = e.clientY - lastY;
      const dist = Math.hypot(vx, vy);

      lastX = e.clientX;
      lastY = e.clientY;

      if (dist > 3) {
        // Spawn 1 to 3 particles depending on speed
        const count = Math.min(Math.floor(dist / 8) + 1, 3);
        for (let i = 0; i < count; i++) {
          spawnParticle(e.clientX, e.clientY, vx, vy);
        }
      }

      isMoving = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        isMoving = false;
      }, 1500);
    },
    { passive: true }
  );

  let animFrameId = null;

  function renderTrail() {
    ctx.clearRect(0, 0, width, height);

    let hasActive = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) continue;

      hasActive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94; // fluid friction damping
      p.vy *= 0.94;
      p.alpha -= p.decay;
      p.radius *= 0.96;

      if (p.alpha <= 0.01 || p.radius <= 1) {
        p.active = false;
        continue;
      }

      // Draw soft fluid glow dot
      const grad = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        Math.max(p.radius, 1)
      );
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(1, "transparent");

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(p.radius, 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animFrameId = requestAnimationFrame(renderTrail);
  }

  renderTrail();

  // Handle visibility change (pause rendering when tab is hidden)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    } else {
      renderTrail();
    }
  });

  /* =========================================================
     2. 3D CARD TILT & SPECULAR CURSOR SPOTLIGHT
     ========================================================= */
  function initCardTilt() {
    const cards = document.querySelectorAll(
      ".card, .project-card, .skill-group, .timeline-content, .hero-stage"
    );

    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS custom properties for radial spotlight highlight
        card.style.setProperty("--mouse-x", x.toFixed(1) + "px");
        card.style.setProperty("--mouse-y", y.toFixed(1) + "px");

        // Subtle 3D tilt calculation
        const xPct = x / rect.width;
        const yPct = y / rect.height;
        const rotX = ((0.5 - yPct) * 9).toFixed(2);
        const rotY = ((xPct - 0.5) * 9).toFixed(2);

        card.style.transform =
          "perspective(1000px) rotateX(" +
          rotX +
          "deg) rotateY(" +
          rotY +
          "deg) translateY(-3px)";
      });

      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
        card.style.setProperty("--mouse-x", "50%");
        card.style.setProperty("--mouse-y", "50%");
      });
    });
  }

  /* =========================================================
     3. MAGNETIC BUTTONS & MICRO-INTERACTIONS
     ========================================================= */
  function initMagneticElements() {
    const magnets = document.querySelectorAll(
      ".btn--primary, .btn--ghost, .theme-toggle, .nav-logo"
    );

    magnets.forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = (e.clientX - centerX) * 0.22;
        const dy = (e.clientY - centerY) * 0.22;

        el.style.transform =
          "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px, 0)";
      });

      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initCardTilt();
      initMagneticElements();
    });
  } else {
    initCardTilt();
    initMagneticElements();
  }
})();
