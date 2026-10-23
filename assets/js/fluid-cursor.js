/* =========================================================
   Hrishikesh Kini — Cursor polish
   - Specular 3D tilt & cursor spotlight on cards & project showcases
   - Subtle magnetic pull on interactive buttons & nav elements
   (The old blurry ember particle trail was removed per DESIGN_SPEC.md.)
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
     3D CARD TILT & SPECULAR CURSOR SPOTLIGHT
     ========================================================= */
  function initCardTilt() {
    const cards = document.querySelectorAll(
      ".card, .project-card, .skill-group, .timeline-content"
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
