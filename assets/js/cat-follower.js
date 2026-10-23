/* =========================================================
   Hrishikesh Kini — Cat Follower
   Plain three.js port of CatFollower.tsx (the site is buildless
   static HTML, so there is no React / R3F here).

   - Realistic rigged .glb, PBR-lit with a key light + env map
   - Head + neck follow the cursor (clamped, damped)
   - Starts on the hero circle ([data-cat-anchor]); once the hero is scrolled
     away it just sits in the bottom-right corner instead of travelling
     between sections
   - Fixed, transparent, pointer-events:none, aria-hidden layer
   - Lazy-loads after first paint, dpr capped at 2, pauses when
     the tab is hidden, renders nothing until the model is ready
   - Honors prefers-reduced-motion; touch devices hold an idle pose

   Model: "Toon Cat FREE" by Omabuarts Studio (Sketchfab), CC-BY-4.0.
   Bones are found by name: neck_017, head_018 (see BONE CASE below).
   ========================================================= */

import * as THREE from "../vendor/three/three.module.js";
import { GLTFLoader } from "../vendor/three/examples/loaders/GLTFLoader.js";
import { RoomEnvironment } from "../vendor/three/examples/environments/RoomEnvironment.js";

(function () {
  "use strict";

  /* ---------------- tuning knobs ---------------- */
  const MODEL_URL = "assets/models/cat.glb";
  const ANCHOR_SELECTOR = "[data-cat-anchor]";

  const HEAD_MAX_YAW = 0.6; // radians, left/right (kept modest so the silhouette
  const HEAD_MAX_PITCH = 0.4; // never swings past the viewport edge when docked
  const BODY_MAX_YAW = 0.18; // the body barely turns: the head does the looking,
  // which keeps the deep tail inside the frame when docked in the corner
  const LOOK_SHARE_NECK = 0.4; // neck takes this share, head takes the rest
  const FOLLOW_DAMPING = 4; // higher = snappier travel between anchors
  const LOOK_DAMPING = 6; // higher = snappier head turn
  const CAT_SCALE_DESKTOP = 3.9; // tuned so the cat stands on the hero circle
  const CAT_SCALE_MOBILE = 1.0; // <768px: smaller, docks bottom-right
  const DOCK_SCALE_MULT = 0.6; // docked cat is smaller than an anchored cat
  const TARGET_HEIGHT = 0.45; // the model is normalised to this world height
  const ANCHOR_HEIGHT_RATIO = 0.6; // cat sits 60% down the anchor
  const SAFE_TOP_PX = 76; // keep the cat clear of the fixed nav
  const SAFE_EDGE_PX = 12; // and clear of the viewport edges

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;
  const noTracking = prefersReducedMotion || isTouch;

  /* ---------------- DOM: the fixed, transparent layer ---------------- */
  const layer = document.getElementById("cat-layer");
  const canvas = document.getElementById("cat-canvas");
  if (!layer || !canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (err) {
    return; // no WebGL: nothing is shown, the page is unaffected
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8); // per spec
  camera.lookAt(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  // group = travel layer; model sits inside it, feet at the group origin
  const group = new THREE.Group();
  scene.add(group);

  /* ---------------- sizing ---------------- */
  let width = 0;
  let height = 0;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* screen px -> world position on the z = 0 plane */
  const worldHeight = () => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const pxToWorldLen = (px) => (px / Math.max(1, height)) * worldHeight();
  function pxToWorld(px, py, out) {
    const wh = worldHeight();
    const ww = wh * camera.aspect;
    out.set((px / width - 0.5) * ww, -(py / height - 0.5) * wh, 0);
    return out;
  }

  /* The model's size in world units at group scale 1 (filled in on load).
     w = width, d = depth (the tail makes this the largest dimension),
     h = height. All three are used to keep the whole cat on screen. */
  const catBox = { w: TARGET_HEIGHT, h: TARGET_HEIGHT, d: TARGET_HEIGHT, norm: 1 };

  /* Never let the cat ride off the top, bottom or sides of the viewport.
     Rotation-aware: a yawed cat is wider than its footprint (the deep tail
     swings into view), so the bounds use the projected half-diagonal. */
  function clampTarget(t, s) {
    const wh = worldHeight();
    const ww = wh * camera.aspect;
    const yawMax = BODY_MAX_YAW + HEAD_MAX_YAW * (1 - LOOK_SHARE_NECK);
    const halfProjW = 0.5 * (catBox.w * Math.abs(Math.cos(yawMax)) + catBox.d * Math.abs(Math.sin(yawMax))) * s;
    const extraH = 0.5 * catBox.d * Math.abs(Math.sin(HEAD_MAX_PITCH * (1 - LOOK_SHARE_NECK))) * s;
    const h = catBox.h * s + extraH;
    const top = pxToWorldLen(SAFE_TOP_PX);
    const edge = pxToWorldLen(SAFE_EDGE_PX);

    const minFeetY = -wh / 2 + edge;
    const maxFeetY = wh / 2 - top - h;
    t.y = maxFeetY < minFeetY ? minFeetY : THREE.MathUtils.clamp(t.y, minFeetY, maxFeetY);

    const maxX = ww / 2 - edge - halfProjW;
    t.x = THREE.MathUtils.clamp(t.x, -Math.max(0, maxX), Math.max(0, maxX));
    return t;
  }

  /* ---------------- cursor ---------------- */
  const pointer = new THREE.Vector2(0, 0);
  if (!noTracking) {
    window.addEventListener(
      "pointermove",
      function (e) {
        pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      },
      { passive: true }
    );
    // last touch point, so a tap still turns the head
    window.addEventListener(
      "touchstart",
      function (e) {
        const t = e.touches && e.touches[0];
        if (!t) return;
        pointer.set((t.clientX / window.innerWidth) * 2 - 1, -((t.clientY / window.innerHeight) * 2 - 1));
      },
      { passive: true }
    );
  }

  /* ---------------- anchor picking ---------------- */
  const target = new THREE.Vector3();
  let targetScale = CAT_SCALE_DESKTOP;

  function pickAnchor() {
    const compact = width < 768;

    let bestEl = null;
    let bestDist = Infinity;
    const whNow = worldHeight();
    if (!compact) {
      const anchors = document.querySelectorAll(ANCHOR_SELECTOR);
      for (let i = 0; i < anchors.length; i++) {
        const el = anchors[i];
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // hidden anchors
        const s = parseFloat(el.getAttribute("data-cat-scale") || "");
        const anchorScale = isNaN(s) ? CAT_SCALE_DESKTOP : s;
        const catPxH = catBox.h * anchorScale * (height / whNow);
        const ty = r.top + r.height * ANCHOR_HEIGHT_RATIO;
        // Only use an anchor whose target point fits fully on screen below the
        // nav. Otherwise the clamp would pin the cat on top of the content.
        if (ty - catPxH < SAFE_TOP_PX) continue;
        if (ty > height - SAFE_EDGE_PX) continue;
        const d = Math.abs(ty - height / 2);
        if (d < bestDist) {
          bestDist = d;
          bestEl = el;
        }
      }
    }

    if (bestEl) {
      const r = bestEl.getBoundingClientRect();
      pxToWorld(r.left + r.width / 2, r.top + r.height * ANCHOR_HEIGHT_RATIO, target);
      const s = parseFloat(bestEl.getAttribute("data-cat-scale") || "");
      targetScale = isNaN(s) ? CAT_SCALE_DESKTOP : s;
      return clampTarget(target, targetScale);
    }

    // Off the hero: just sit in the corner. This is the resting place for the
    // whole rest of the page, so the cat does not travel between sections.
    pxToWorld(width - (compact ? 8 : 10), height - (compact ? 8 : 10), target);
    targetScale = compact
      ? CAT_SCALE_MOBILE * 0.85
      : width < 1024
        ? 1.7
        : CAT_SCALE_DESKTOP * DOCK_SCALE_MULT;
    return clampTarget(target, targetScale);
  }

  /* ---------------- model ---------------- */
  let head = null;
  let neck = null;
  let tailBones = [];
  let torso = null;
  let ready = false;
  const restHead = new THREE.Quaternion();
  const restNeck = new THREE.Quaternion();
  const restTail = [];

  const lookEuler = new THREE.Euler(0, 0, 0, "YXZ");
  const lookQuat = new THREE.Quaternion();
  const tmpQuat = new THREE.Quaternion();
  const tmpQuat2 = new THREE.Quaternion();
  const tailEuler = new THREE.Euler(0, 0, 0, "XYZ");

  function boneName(o) {
    return (o.name || "").toLowerCase();
  }

  function findBones(root) {
    // BONE CASE A: this model HAS head/neck bones (neck_017, head_018).
    // The matcher is tolerant so a differently-named rig still works.
    let h = null;
    let n = null;
    root.traverse(function (o) {
      if (!o.isBone) return;
      const name = boneName(o);
      if (!h && /(^|[^a-z])head($|[^a-z0-9])/.test(name)) h = o;
      if (!n && /(^|[^a-z])neck($|[^a-z0-9])/.test(name)) n = o;
    });
    return { h, n };
  }

  function onModelReady(gltf) {
    const model = gltf.scene;

    const found = findBones(model);
    head = found.h;
    neck = found.n;
    if (!head) {
      console.warn("[cat] no 'head' bone found; falling back to whole-body rotation");
    } else {
      console.info("[cat] head bone:", head.name, "| neck bone:", neck ? neck.name : "(none)");
    }
    if (head) restHead.copy(head.quaternion);
    if (neck) restNeck.copy(neck.quaternion);

    const allBones = [];
    model.traverse(function (o) {
      if (o.isBone) allBones.push(o.name);
    });
    console.info("[cat] bones (" + allBones.length + "):", allBones.join(", "));

    model.traverse(function (o) {
      if (!o.isBone) return;
      const name = boneName(o);
      if (/(^|[^a-z])(torso|spine)($|[^a-z0-9])/.test(name) && !torso) torso = o;
      if (/(^|[^a-z])tail/.test(name)) {
        tailBones.push(o);
        restTail.push(o.quaternion.clone());
      }
    });

    // The animation in this file is a 45-track rest-pose dump (0 animated
    // tracks), so a mixer would only fight the head tracking. Skip it.

    // Normalise: model is ~364 world units tall, origin already near the feet.
    model.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let usedSkin = false;
    model.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      o.computeBoundingBox(); // skinned-aware in r151+
      const b = o.boundingBox.clone().applyMatrix4(o.matrixWorld);
      box.union(b);
      usedSkin = true;
    });
    if (!usedSkin || box.isEmpty()) box.setFromObject(model);

    const naturalHeight = Math.max(1e-6, box.max.y - box.min.y);
    const norm = TARGET_HEIGHT / naturalHeight;
    model.scale.multiplyScalar(norm);
    model.position.y = -box.min.y * norm; // feet rest at the group origin
    model.position.x = -(box.min.x + box.max.x) / 2 * norm; // centre on X
    model.position.z = -(box.min.z + box.max.z) / 2 * norm; // centre on Z

    // remember the normalised footprint so clampTarget() can keep it on screen
    catBox.h = TARGET_HEIGHT;
    catBox.w = Math.max(1e-4, (box.max.x - box.min.x) * norm);
    catBox.d = Math.max(1e-4, (box.max.z - box.min.z) * norm);

    group.add(model);
    group.scale.setScalar(CAT_SCALE_DESKTOP);

    // start on the hero anchor rather than flying in from 0,0
    pickAnchor();
    group.position.copy(target);
    group.scale.setScalar(targetScale);

    ready = true;
    layer.classList.add("is-ready");
  }

  function loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      onModelReady,
      undefined,
      function (err) {
        console.warn("[cat] model failed to load", err);
      }
    );
  }

  /* lazy-load after first paint so the model never hurts LCP */
  function scheduleLoad() {
    const kick = function () {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadModel, { timeout: 2000 });
      } else {
        setTimeout(loadModel, 200);
      }
    };
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });
  }

  /* ---------------- render loop ---------------- */
  let last = performance.now();
  let idleClock = 0;
  const startTime = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);

    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;

    // pause when the tab is hidden
    if (document.hidden) return;
    if (!ready) return; // render nothing until the model is ready

    idleClock += dt;
    const elapsed = (now - startTime) / 1000;
    const compact = width < 768;
    const reduce = prefersReducedMotion;

    // 1) travel to the current anchor
    pickAnchor();
    const k = reduce ? 100 : FOLLOW_DAMPING;
    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, k, dt);
    group.position.y = THREE.MathUtils.damp(group.position.y, target.y, k, dt);
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, targetScale, 4, dt));

    // 2) body: turn a little toward the cursor, and face the camera
    const wh = worldHeight();
    const ww = wh * camera.aspect;
    // No cursor (touch) or reduced motion: hold a straight-ahead idle pose.
    const tracking = !noTracking;
    const dx = tracking
      ? THREE.MathUtils.clamp(pointer.x - (group.position.x / ww) * 2, -1, 1)
      : 0;
    const dy = tracking ? THREE.MathUtils.clamp(pointer.y, -1, 1) : 0;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, dx * BODY_MAX_YAW, LOOK_DAMPING, dt);

    // whole-body fallback if the rig has no head bone
    if (!head) {
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, dx * HEAD_MAX_YAW, LOOK_DAMPING, dt);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -dy * HEAD_MAX_PITCH * 0.5, LOOK_DAMPING, dt);
    }

    // 3) head + neck look at the cursor (neck 40%, head 60%)
    const applyLook = function (bone, base, share) {
      if (!bone) return;
      lookEuler.set(-dy * HEAD_MAX_PITCH * share, dx * HEAD_MAX_YAW * share, 0, "YXZ");
      tmpQuat.setFromEuler(lookEuler);
      lookQuat.copy(base).multiply(tmpQuat);
      bone.quaternion.slerp(lookQuat, 1 - Math.exp(-LOOK_DAMPING * dt));
    };
    applyLook(neck, restNeck, LOOK_SHARE_NECK);
    applyLook(head, restHead, 1 - LOOK_SHARE_NECK);

    // 4) idle life: gentle breathing + tail sway (the clip is static)
    if (!reduce) {
      if (torso) torso.scale.setScalar(1 + Math.sin(idleClock * 1.6) * 0.012);
      for (let i = 0; i < tailBones.length; i++) {
        tailEuler.set(0, 0, Math.sin(idleClock * 1.3 + i * 0.7) * 0.05, "XYZ");
        tmpQuat.copy(restTail[i]).multiply(tmpQuat2.setFromEuler(tailEuler));
        tailBones[i].quaternion.slerp(tmpQuat, 0.15);
      }
    }

    // subtle float, matching the hero motion
    group.position.y += reduce ? 0 : Math.sin(elapsed * (Math.PI * 2 / 5)) * 0.004;

    renderer.render(scene, camera);
  }

  // Draw once now (a no-op until ready) so the canvas is sized correctly.
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
  scheduleLoad();
})();