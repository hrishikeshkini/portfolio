/* =========================================================
   Hrishikesh Kini — Curious Cat Companion
   Pure SVG + CSS animation, event-driven JS (no rAF loop).
   - 2D accessories: Glasses, Bowtie, Coffee mug, Tech badge, All
   - Interactive cross-section and cross-page traveling animations
   - Pupils track the cursor (desktop only, reduced-motion off)
   - Dynamic speech bubbles on section navigation + click
   - Auto-initializes on project pages so the companion follows you
   - Mute, accessory & dismiss persisted in storage
   ========================================================= */
(function () {
  "use strict";

  var MUTE_KEY = "hk-cat-muted";
  var HIDE_KEY = "hk-cat-hidden";
  var ACCESSORY_KEY = "hk-cat-accessory";
  var TRAVEL_KEY = "hk-cat-traveled";

  var BUBBLE_MS = 3800;
  var SECTION_COOLDOWN = 14000;
  var BOOT_GRACE = 2000;

  var ACCESSORIES = ["glasses", "bowtie", "coffee", "badge", "all", "none"];
  var ACCESSORY_LINES = {
    glasses: "Smart AI vision glasses activated! 👓",
    bowtie: "Dapper AI engineer mode! 👔",
    coffee: "Powered by fresh espresso & neural nets ☕",
    badge: "Official Production AI Lead badge ⭐",
    all: "Fully outfitted for the workshop! ✨",
    none: "Cozy natural feline mode 🐾"
  };

  var CLICK_LINES = [
    "Meow! Welcome to Hrishikesh's AI Workshop 🛠️",
    "Did you know Hrishikesh led AI systems driving ₹200+ Cr impact? 🚀",
    "Curious about LLMs, RAG or Agentic systems? Check out the projects!",
    "Our support chatbot cut response times by 40% — nice and snappy ⚡",
    "Fresh coffee brewed for training neural nets ☕",
    "Want to build production AI together? Let's connect below!"
  ];

  var SECTION_LINES = {
    about: "From notebooks to production reality — scroll on! 📘",
    experience: "Real production AI lives here — ₹200+ Cr business impact.",
    projects: "Production builds & deep dives — my favorite room! 🛠️",
    skills: "The AI engineer's core toolbox.",
    writing: "Quantitative finance & applied data science write-ups ✍️",
    contact: "Drop a line — Hrishikesh responds to every message!"
  };

  /* ---------------- Ensure Companion Markup Exists ---------------- */
  function ensureCompanionMarkup() {
    var existing = document.getElementById("companion");
    if (existing) return existing;

    var aside = document.createElement("aside");
    aside.className = "companion";
    aside.id = "companion";
    aside.setAttribute("aria-label", "Curious cat companion");

    aside.innerHTML = [
      '<p class="cat-bubble" id="cat-bubble" role="status" aria-hidden="true"></p>',
      '<button class="cat-button" id="cat-button" aria-label="Play with the cat mascot" title="Meow?">',
      '  <svg class="cat cat--mini" viewBox="0 0 240 220" aria-hidden="true">',
      '    <!-- Tail with white tip -->',
      '    <g class="cat-tail">',
      '      <path d="M192 178 C 228 170, 238 136, 222 110" fill="none" stroke="var(--cat-fur)" stroke-width="14" stroke-linecap="round"/>',
      '      <circle cx="222" cy="110" r="8" fill="var(--cat-white)"/>',
      '    </g>',
      '    <!-- Ginger Torso & White Chest Bib -->',
      '    <path d="M54 210 L54 152 C54 102 82 64 120 64 C158 64 186 102 186 152 L186 210 Z" fill="var(--cat-fur)" stroke="var(--cat-stroke)" stroke-width="3" stroke-linejoin="round"/>',
      '    <ellipse cx="120" cy="158" rx="34" ry="38" fill="var(--cat-white)"/>',
      '    <!-- White Front Paws -->',
      '    <rect x="86" y="186" width="30" height="24" rx="12" fill="var(--cat-white)" stroke="var(--cat-stroke)" stroke-width="2.5"/>',
      '    <path class="cat-paw-front" d="M124 186 h28 a12 12 0 0 1 12 12 v12 h-52 v-12 a12 12 0 0 1 12-12 Z" fill="var(--cat-white)" stroke="var(--cat-stroke)" stroke-width="2.5"/>',
      '    <!-- Ears with Pink Interior -->',
      '    <g>',
      '      <path class="cat-ear cat-ear-l" d="M88 34 L76 2 L116 24 Z" fill="var(--cat-fur)" stroke="var(--cat-stroke)" stroke-width="3" stroke-linejoin="round"/>',
      '      <path class="cat-ear cat-ear-r" d="M152 34 L164 2 L124 24 Z" fill="var(--cat-fur)" stroke="var(--cat-stroke)" stroke-width="3" stroke-linejoin="round"/>',
      '      <path d="M90 27 L84 10 L106 22 Z" fill="var(--cat-pink)"/>',
      '      <path d="M150 27 L156 10 L134 22 Z" fill="var(--cat-pink)"/>',
      '    </g>',
      '    <!-- Round Ginger Head -->',
      '    <circle cx="120" cy="62" r="42" fill="var(--cat-fur)" stroke="var(--cat-stroke)" stroke-width="3"/>',
      '    <!-- Tiger Forehead Stripes -->',
      '    <g opacity="0.6">',
      '      <path d="M108 26 q3 8 0 14 M120 24 q3 9 0 18 M132 26 q3 8 0 14" fill="none" stroke="var(--cat-fur-shadow)" stroke-width="3.2" stroke-linecap="round"/>',
      '    </g>',
      '    <!-- White Muzzle & Cheeks -->',
      '    <ellipse cx="106" cy="74" rx="16" ry="13" fill="var(--cat-white)"/>',
      '    <ellipse cx="134" cy="74" rx="16" ry="13" fill="var(--cat-white)"/>',
      '    <ellipse cx="120" cy="78" rx="14" ry="11" fill="var(--cat-white)"/>',
      '    <!-- Sparkling Amber Eyes with Double Glints -->',
      '    <g class="cat-eyes">',
      '      <circle class="cat-eye" cx="102" cy="60" r="9" fill="var(--cat-amber)"/>',
      '      <circle class="cat-eye" cx="138" cy="60" r="9" fill="var(--cat-amber)"/>',
      '      <g class="cat-pupils">',
      '        <circle class="cat-pupil" cx="103" cy="60.5" r="4.2" fill="var(--cat-pupil)"/>',
      '        <circle class="cat-pupil" cx="137" cy="60.5" r="4.2" fill="var(--cat-pupil)"/>',
      '        <circle cx="99.5" cy="57" r="2.2" fill="#ffffff"/>',
      '        <circle cx="135.5" cy="57" r="2.2" fill="#ffffff"/>',
      '        <circle cx="105" cy="63.5" r="1.1" fill="#ffffff"/>',
      '        <circle cx="139" cy="63.5" r="1.1" fill="#ffffff"/>',
      '      </g>',
      '    </g>',
      '    <!-- Pink Nose & Mouth -->',
      '    <path d="M114 74 L126 74 L120 81 Z" fill="var(--cat-pink)"/>',
      '    <path class="cat-mouth" d="M120 81 Q113 88 107 84 M120 81 Q127 88 133 84" fill="none" stroke="var(--cat-stroke)" stroke-width="2.5" stroke-linecap="round"/>',
      '    <!-- Whiskers -->',
      '    <g opacity="0.6">',
      '      <path d="M82 68 L50 64 M82 76 L50 78 M84 84 L56 90 M158 68 L190 64 M158 76 L190 78 M156 84 L184 90" stroke="var(--cat-stroke)" stroke-width="2" stroke-linecap="round"/>',
      '    </g>',
      '    <!-- 2D Accessories -->',
      '    <g class="cat-item cat-item--glasses" id="cat-item-glasses">',
      '      <circle cx="102" cy="60" r="14" fill="none" stroke="var(--accent)" stroke-width="2.8"/>',
      '      <circle cx="138" cy="60" r="14" fill="none" stroke="var(--accent)" stroke-width="2.8"/>',
      '      <path d="M116 60 Q120 57 124 60" fill="none" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round"/>',
      '      <path d="M88 60 L76 56 M152 60 L164 56" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/>',
      '      <path d="M95 53 L100 48 M131 53 L136 48" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>',
      '    </g>',
      '    <g class="cat-item cat-item--bowtie" id="cat-item-bowtie">',
      '      <polygon points="120,112 100,102 100,122" fill="var(--accent)" stroke="var(--cat-stroke)" stroke-width="2" stroke-linejoin="round"/>',
      '      <polygon points="120,112 140,102 140,122" fill="var(--accent)" stroke="var(--cat-stroke)" stroke-width="2" stroke-linejoin="round"/>',
      '      <circle cx="120" cy="112" r="4.5" fill="var(--accent-hover)" stroke="var(--cat-stroke)" stroke-width="2"/>',
      '    </g>',
      '    <g class="cat-item cat-item--badge" id="cat-item-badge">',
      '      <circle cx="120" cy="158" r="12" fill="var(--bg-card)" stroke="var(--cat-stroke)" stroke-width="2"/>',
      '      <path d="M120 149 L122.5 155 L129 155.5 L124 160 L125.5 166.5 L120 163 L114.5 166.5 L116 160 L111 155.5 L117.5 155 Z" fill="var(--accent)"/>',
      '    </g>',
      '    <g class="cat-item cat-item--coffee" id="cat-item-coffee">',
      '      <rect x="58" y="180" width="22" height="24" rx="3" fill="var(--bg-card)" stroke="var(--cat-stroke)" stroke-width="2.4"/>',
      '      <path d="M58 186 C50 186 50 198 58 198" fill="none" stroke="var(--cat-stroke)" stroke-width="2.4"/>',
      '      <path d="M69 191 q-2.5 -3.5 -2.5 -5 a2 2 0 0 1 4 0 a2 2 0 0 1 4 0 q0 1.5 -2.5 5 l-1.5 1.5 z" fill="var(--accent)"/>',
      '      <path class="cat-steam" d="M64 176 Q62 170 66 166 M71 176 Q73 170 69 166" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>',
      '    </g>',
      '  </svg>',
      '</button>',
      '<div class="cat-tools">',
      '  <button class="cat-tool" id="cat-accessory" aria-label="Change cat\'s 2D accessory" title="Change accessory (Glasses, Bowtie, Badge, Coffee)">',
      '    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a4 4 0 0 0-4 4c0 1.6 1 3 2.4 3.7L3 14a2 2 0 0 0-1 1.7V17h20v-1.3a2 2 0 0 0-1-1.7l-7.4-4.3A4 4 0 0 0 16 6a4 4 0 0 0-4-4zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>',
      '  </button>',
      '  <button class="cat-tool" id="cat-mute" aria-pressed="false" aria-label="Mute the cat\'s chatter">',
      '    <svg class="icon-bell" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l1 -3 4 2 4 3 4 2 4 -2 1 3 -5 1 -4 -2 -4 -3 z"/><path d="M12 20h.01"/></svg>',
      '    <svg class="icon-bell-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l1 -3 4 2 4 3 4 2 4 -2 1 3 -5 1 -4 -2 -4 -3 z"/><path d="M12 20h.01"/><path d="M4 4l16 16"/></svg>',
      '  </button>',
      '  <button class="cat-tool" id="cat-hide" aria-label="Hide the cat">',
      '    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      '  </button>',
      '</div>'
    ].join("");

    var restore = document.createElement("button");
    restore.className = "cat-restore";
    restore.id = "cat-restore";
    restore.setAttribute("aria-label", "Show the cat again");
    restore.hidden = true;
    restore.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="9" r="2.2"/><circle cx="12" cy="6.6" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M12 11c-2.4 0-4.5 1.8-4.5 3.8 0 1.2 1 2.2 2.2 2.2h4.6c1.2 0 2.2-1 2.2-2.2 0-2-2.1-3.8-4.5-3.8z"/></svg>';

    document.body.appendChild(aside);
    document.body.appendChild(restore);
    return aside;
  }

  var companion = ensureCompanionMarkup();
  var button = document.getElementById("cat-button");
  var bubble = document.getElementById("cat-bubble");
  var muteBtn = document.getElementById("cat-mute");
  var hideBtn = document.getElementById("cat-hide");
  var restoreBtn = document.getElementById("cat-restore");
  var accessoryBtn = document.getElementById("cat-accessory");

  var reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
  var mobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var hoverEnabled = !reducedMotion && !noHover && !mobile;

  var muted = false;
  var hidden = false;
  var currentAccessory = "glasses"; // default smart glasses
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
    hidden = localStorage.getItem(HIDE_KEY) === "1";
    var savedAcc = localStorage.getItem(ACCESSORY_KEY);
    if (savedAcc && ACCESSORIES.indexOf(savedAcc) !== -1) {
      currentAccessory = savedAcc;
    }
  } catch (e) { /* fresh session */ }

  /* ---------------- Accessories Handling ---------------- */
  function applyAccessory(accName) {
    currentAccessory = accName;
    companion.setAttribute("data-accessory", currentAccessory);
    try {
      localStorage.setItem(ACCESSORY_KEY, currentAccessory);
    } catch (e) { }
  }

  function cycleAccessory() {
    var curIdx = ACCESSORIES.indexOf(currentAccessory);
    var nextIdx = (curIdx + 1) % ACCESSORIES.length;
    var nextAcc = ACCESSORIES[nextIdx];
    applyAccessory(nextAcc);
    say(ACCESSORY_LINES[nextAcc] || "Looking good! ✨", true);

    // Subtle happy bounce
    if (button) {
      button.classList.remove("is-happy");
      void button.offsetWidth;
      button.classList.add("is-happy");
    }
  }

  if (accessoryBtn) {
    accessoryBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      cycleAccessory();
    });
  }

  /* ---------------- Speech Bubble ---------------- */
  var bubbleTimer = null;
  var lastSectionBubble = 0;
  var bootAt = Date.now();

  function hideBubble() {
    if (!bubble) return;
    bubble.classList.remove("is-visible");
    bubble.setAttribute("aria-hidden", "true");
  }

  function say(text, force) {
    if (!bubble || muted || hidden) return;
    if (!force) {
      var now = Date.now();
      if (now - bootAt < BOOT_GRACE) return;
      if (now - lastSectionBubble < SECTION_COOLDOWN) return;
      lastSectionBubble = now;
    }
    bubble.textContent = text;
    bubble.setAttribute("aria-hidden", "false");
    bubble.classList.add("is-visible");
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, BUBBLE_MS);
  }

  /* ---------------- Travel & Leap Movement ---------------- */
  function triggerTravel(targetRemark) {
    if (reducedMotion || hidden) {
      if (targetRemark) say(targetRemark, true);
      return;
    }

    companion.classList.remove("is-settling");
    companion.classList.remove("is-traveling");
    void companion.offsetWidth; // reflow to restart animation
    companion.classList.add("is-traveling");

    setTimeout(function () {
      companion.classList.remove("is-traveling");
      companion.classList.add("is-settling");
      if (targetRemark) {
        say(targetRemark, true);
      }
      setTimeout(function () {
        companion.classList.remove("is-settling");
      }, 700);
    }, 750);
  }

  // Cross-page link detection: dash ahead when clicking internal links
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link || !link.href) return;

    var href = link.getAttribute("href");
    if (!href) return;

    // Anchor navigation in same page
    if (href.charAt(0) === "#") {
      var sectionId = href.substring(1);
      if (sectionId && SECTION_LINES[sectionId]) {
        triggerTravel(SECTION_LINES[sectionId]);
      } else {
        triggerTravel("Traveling with you! 🐾");
      }
      return;
    }

    // Navigating between pages (e.g. to a project page or back to index)
    if (
      link.hostname === window.location.hostname &&
      !link.target &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      try {
        sessionStorage.setItem(TRAVEL_KEY, "1");
      } catch (err) { }
      triggerTravel("Dashing ahead to the next page! 🐾");
    }
  });

  // Check if just arrived from a page transition
  try {
    if (sessionStorage.getItem(TRAVEL_KEY) === "1") {
      sessionStorage.removeItem(TRAVEL_KEY);
      setTimeout(function () {
        var pageTitle = document.title || "";
        var greeting = "Made it! Welcome to " + (pageTitle.split("·")[0].split("—")[0].trim() || "this room") + " 🐾";
        triggerTravel(greeting);
      }, 600);
    }
  } catch (err) { }

  /* ---------------- Pupils & Corner Motion ---------------- */
  var stages = [];

  function buildStages() {
    stages = [];
    var stagesCollection = document.querySelectorAll(".cat--mini");
    stagesCollection.forEach(function (svg) {
      var group = svg.querySelector(".cat-pupils");
      if (!group) return;
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      stages.push({
        svg: svg,
        group: group,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        maxX: 3.5,
      });
    });
  }

  var stale = true;

  function onPointerMove(e) {
    if (!hoverEnabled) return;
    if (!stages.length || stale) {
      buildStages();
      stale = false;
      if (!stages.length) return;
    }

    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      var dx = e.clientX - s.cx;
      var dy = e.clientY - s.cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var step = Math.min(s.maxX, len / 35);

      s.group.style.transform =
        "translate(" +
        ((dx / len) * step).toFixed(2) +
        "px," +
        ((dy / len) * step).toFixed(2) +
        "px)";

      var tiltDeg = Math.max(-12, Math.min(12, (dx / window.innerWidth) * 16));
      if (button) {
        button.style.transform = "rotate(" + tiltDeg.toFixed(1) + "deg)";
      }
    }
  }

  if (hoverEnabled) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", function () { stale = true; }, { passive: true });
    window.addEventListener("scroll", function () { stale = true; }, { passive: true });
  }

  /* ---------------- Controls ---------------- */
  function applyMuted() {
    if (muteBtn) {
      muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
      muteBtn.setAttribute("aria-label", muted ? "Unmute the cat's chatter" : "Mute the cat's chatter");
    }
    companion.classList.toggle("cat--mood-muted", muted);
    if (muted) hideBubble();
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) { }
  }

  function applyHidden() {
    companion.style.display = hidden ? "none" : "";
    if (restoreBtn) restoreBtn.hidden = !hidden;
    if (hidden) hideBubble();
    try { localStorage.setItem(HIDE_KEY, hidden ? "1" : "0"); } catch (e) { }
  }

  if (muteBtn) muteBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    muted = !muted;
    applyMuted();
  });

  if (hideBtn) hideBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    hidden = true;
    applyHidden();
  });

  if (restoreBtn) restoreBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    hidden = false;
    applyHidden();
  });

  var clickIndex = 0;
  if (button) button.addEventListener("click", function () {
    button.classList.remove("is-happy");
    void button.offsetWidth;
    button.classList.add("is-happy");

    // Every 4th click, suggest or swap an accessory!
    if (clickIndex % 4 === 3) {
      cycleAccessory();
    } else {
      say(CLICK_LINES[clickIndex % CLICK_LINES.length], true);
    }
    clickIndex++;
  });

  /* ---------------- Section Scroll Reactions ---------------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var line = SECTION_LINES[entry.target.id];
        if (line) triggerTravel(line);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    Object.keys(SECTION_LINES).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------------- Initial Boot ---------------- */
  applyAccessory(currentAccessory);
  if (muteBtn) applyMuted();
  applyHidden();
})();
