/* =========================================================
   Hrishikesh Kini — 3D particle monogram
   "HK" assembled from glowing particles sampled from canvas-
   rendered text. Mouse-repulsion swirl, slow idle rotation,
   theme-aware colors, graceful 2D fallback when WebGL or the
   module is unavailable. Loaded only on pages with #logo-canvas.
   ========================================================= */
import * as THREE from "../vendor/three/three.module.js";

const TEXT = "HK";
// Scale particle density down on mobile / low-end devices (SKILL.md anti-pattern:
// desktop-only 3D). 6000 on desktop, 2500 on phones or small viewports.
const IS_MOBILE =
  /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
const PARTICLE_COUNT = IS_MOBILE ? 2500 : 6000;
const MOUSE_RADIUS = 1.6;
const ASSEMBLE_DURATION = 2200; // ms

function init() {
  const holder = document.getElementById("logo-canvas");
  if (!holder) return;

  // Respect reduced motion: skip particle system entirely
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    return; // No WebGL -> static SVG fallback stays visible
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  holder.appendChild(renderer.domElement);
  // Hide the static SVG/text fallback now that WebGL is live
  document.body.classList.add("logo3d-active");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  /* ---- Sample particle target positions from rendered text ---- */
  const S = 300;
  const cnv = document.createElement("canvas");
  cnv.width = S;
  cnv.height = S;
  const ctx = cnv.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.font = "700 190px 'Space Grotesk', 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TEXT, S / 2, S / 2 + 10);
  const data = ctx.getImageData(0, 0, S, S).data;

  const targets = [];
  const step = 2;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      if (data[(y * S + x) * 4 + 3] > 128) {
        targets.push(
          new THREE.Vector3(
            (x / S - 0.5) * 7.2,
            -(y / S - 0.5) * 7.2,
            (Math.random() - 0.5) * 0.4
          )
        );
      }
    }
  }
  if (!targets.length) return;

  /* ---- Particle geometry ---- */
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const starts = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);

  const cA = new THREE.Color("#6ea8ff");
  const cB = new THREE.Color("#c084fc");

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = targets[i % targets.length];
    const sx = (Math.random() - 0.5) * 22;
    const sy = (Math.random() - 0.5) * 16;
    const sz = (Math.random() - 0.5) * 14;
    starts[i * 3] = sx;
    starts[i * 3 + 1] = sy;
    starts[i * 3 + 2] = sz;
    positions[i * 3] = sx;
    positions[i * 3 + 1] = sy;
    positions[i * 3 + 2] = sz;
    const mix = Math.random();
    const c = cA.clone().lerp(cB, mix);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  /* ---- Mouse interaction ---- */
  const mouse = new THREE.Vector2(99, 99);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();

  function updatePointer(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((clientY - r.top) / r.height) * 2 + 1;
  }
  window.addEventListener("pointermove", function (e) {
    updatePointer(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener("pointerleave", function () {
    mouse.set(99, 99);
  });

  /* ---- Theme-aware colors ---- */
  function applyTheme(theme) {
    const a = theme === "light" ? new THREE.Color("#2f6bff") : new THREE.Color("#6ea8ff");
    const b = theme === "light" ? new THREE.Color("#7c3aed") : new THREE.Color("#c084fc");
    const attr = geometry.getAttribute("color");
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mix = i / PARTICLE_COUNT;
      const c = a.clone().lerp(b, mix % 1);
      attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
    material.blending =
      theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
  }
  applyTheme(document.documentElement.getAttribute("data-theme") || "dark");
  window.addEventListener("hk-themechange", function (e) {
    applyTheme(e.detail && e.detail.theme ? e.detail.theme : "dark");
  });

  /* ---- Resize ---- */
  function resize() {
    const w = holder.clientWidth || window.innerWidth;
    const h = holder.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* ---- Animation loop ---- */
  const start = performance.now();
  const clock = new THREE.Clock();
  let visible = true;

  const io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
  });
  io.observe(holder);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const dt = clock.getDelta();
    const elapsed = performance.now() - start;
    const progress = Math.min(elapsed / ASSEMBLE_DURATION, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, hit);

    const pos = geometry.getAttribute("position");
    const time = clock.elapsedTime;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const tx = targets[i % targets.length];
      // Scatter offset that fades as particles assemble
      const scatter = 1 - ease;
      const jx = Math.sin(time * 1.4 + seeds[i]) * 0.05;
      const jy = Math.cos(time * 1.1 + seeds[i]) * 0.05;

      let x = tx.x * ease + starts[i * 3] * scatter + jx;
      let y = tx.y * ease + starts[i * 3 + 1] * scatter + jy;
      let z = tx.z * ease + starts[i * 3 + 2] * scatter;

      // Mouse repulsion
      const dx = x - hit.x;
      const dy = y - hit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0.001) {
        const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.9;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
        z += force * 0.6;
      }

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;

    points.rotation.y = Math.sin(time * 0.25) * 0.12;
    points.rotation.x = Math.cos(time * 0.18) * 0.06;

    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
