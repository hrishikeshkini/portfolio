/* =========================================================
   Hrishikesh Kini — Portfolio main.js
   Theme toggle, nav behaviour, project filtering, reveals.
   No framework, no build step. Loaded on every page.
   ========================================================= */
(function () {
  "use strict";

  // Gate JS-dependent styling (scroll reveals). Without this class,
  // everything stays visible and readable — no-JS is a first-class state.
  document.documentElement.classList.add("js");

  /* ---------------- Theme ---------------- */
  const THEME_KEY = "hk-theme";
  const root = document.documentElement;

  // Resolve theme: stored preference -> OS preference -> dark
  function resolveTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  // Apply immediately to avoid flash (also done inline in <head>)
  root.setAttribute("data-theme", resolveTheme());

  function initThemeToggle() {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
      // Let 3D logo pick up new palette
      window.dispatchEvent(new CustomEvent("hk-themechange", { detail: { theme: next } }));
    });
  }

  /* ---------------- Navigation ---------------- */
  function initNav() {
    const nav = document.querySelector(".nav");
    const burger = document.querySelector(".nav-burger");
    const links = document.querySelector(".nav-links");
    if (!nav) return;

    const onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && links) {
      burger.addEventListener("click", function () {
        const open = links.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      // Close menu when a link is clicked
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Highlight active section link (landing page only)
    const sectionIds = ["about", "experience", "projects", "education", "contact"];
    const navAnchors = Array.prototype.slice
      .call(document.querySelectorAll('.nav-links a[href^="#"]'))
      .filter(function (a) {
        return sectionIds.indexOf(a.getAttribute("href").slice(1)) !== -1;
      });
    if (navAnchors.length && "IntersectionObserver" in window) {
      const sections = navAnchors
        .map(function (a) {
          return document.getElementById(a.getAttribute("href").slice(1));
        })
        .filter(Boolean);
      const spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            navAnchors.forEach(function (a) {
              a.classList.toggle(
                "is-active",
                a.getAttribute("href") === "#" + entry.target.id
              );
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach(function (s) {
        spy.observe(s);
      });
    }
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------------- Footer year ---------------- */
  function initYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------- Project page image fallback ----------------
     Project cards reference ../assets/img/project/<slug>.<ext>;
     where a file is missing, swap in the gradient fallback block. */
  function initImgFallbacks() {
    document.querySelectorAll(".project-thumb img").forEach(function (img) {
      img.addEventListener("error", function () {
        const wrap = img.closest(".project-thumb");
        if (!wrap || wrap.querySelector(".thumb-fallback")) return;
        const fb = document.createElement("div");
        fb.className = "thumb-fallback";
        fb.textContent = (wrap.getAttribute("data-initials") || "HK").trim();
        img.replaceWith(fb);
      });
    });
  }

  /* ---------------- Blog feed ----------------
     Posts live in assets/data/blogs.json, refreshed daily by
     .github/workflows/update-blogs.yml from the Medium RSS feed.
     If the fetch fails, the static fallback copy stays visible. */
  function initBlogs() {
    const grid = document.querySelector("#blog-grid");
    if (!grid) return;
    fetch("assets/data/blogs.json")
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        const posts = (data && data.posts) || [];
        if (!posts.length) return;
        grid.innerHTML = posts
          .slice(0, 6)
          .map(function (p) {
            let dateStr = p.date || "";
            try {
              dateStr = new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            } catch (e) { }
            return (
              '<article class="card card--hover blog-card reveal is-visible">' +
              '<span class="chip">Data Science</span>' +
              '<p class="blog-date">' + dateStr + '</p>' +
              '<h3><a href="' + p.link + '" target="_blank" rel="noopener">' + p.title + '</a></h3>' +
              '<p class="blog-excerpt">' + (p.excerpt || "") + '</p>' +
              '<a class="blog-link" href="' + p.link + '" target="_blank" rel="noopener">Read on Medium →</a>' +
              '</article>'
            );
          })
          .join("");
      })
      .catch(function () {
        /* keep existing static crawlable cards */
      });
  }

  /* ---------------- Companion loader across pages ---------------- */
  function initCompanion() {
    if (document.getElementById("companion")) return;
    const isProject = window.location.pathname.indexOf("/projects/") !== -1;
    const s = document.createElement("script");
    s.src = isProject ? "../assets/js/cat.js" : "assets/js/cat.js";
    s.defer = true;
    document.body.appendChild(s);
  }

  /* ---------------- Boot ---------------- */
  function init() {
    initThemeToggle();
    initNav();
    initReveals();
    initYear();
    initImgFallbacks();
    initBlogs();
    initCompanion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
