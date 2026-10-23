/* =========================================================
   Hrishikesh Kini — 3D Cat Logo Engine
   Built with vanilla Three.js per SKILL.md guidelines.
   - Procedural sculptural realistic cat nestled in a modern cat chair
   - Real-time 3D cursor tracking with smooth inertia (lerp)
   - Vertical slit pupils with parallax depth tracking & lifelike blink
   - Playful click reactions: head boop, ear twitch, ember spark burst
   - Theme-aware materials & lighting (dark ember / light bronze)
   - Graceful 2D SVG fallback for no-WebGL or prefers-reduced-motion
   ========================================================= */

import * as THREE from "../vendor/three/three.module.js";

(function () {
  "use strict";

  // Check reduced motion preference
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Global mouse coordinates normalized to [-1, 1]
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isHoveringHero: false };

  // Listen to window pointer movements
  window.addEventListener(
    "pointermove",
    function (e) {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  /* =========================================================
     PALETTES & THEME CONFIGURATION
     ========================================================= */
  const THEMES = {
    dark: {
      body: 0x221e1b,
      bodyRoughness: 0.42,
      bodyMetalness: 0.1,
      chest: 0x362e28,
      innerEar: 0xff8f40,
      innerEarCavity: 0xe05615,
      eyeGlow: 0xffa44a,
      pupil: 0x070605,
      collar: 0xff8f40,
      bell: 0xffc480,
      chairShell: 0x161311,
      chairStem: 0x484038,
      cushion: 0x2e241c,
      cushionTrim: 0xff8f40,
      keyLight: 0xffecd6,
      keyIntensity: 2.1,
      fillLight: 0x4a3b32,
      fillIntensity: 1.0,
      rimLight: 0xff7b29,
      rimIntensity: 3.4,
      sparkColor: 0xff9a47,
    },
    light: {
      body: 0xf3eee5,
      bodyRoughness: 0.46,
      bodyMetalness: 0.04,
      chest: 0xffffff,
      innerEar: 0xc2410c,
      innerEarCavity: 0x9a3412,
      eyeGlow: 0xd97706,
      pupil: 0x181411,
      collar: 0xc2410c,
      bell: 0xd97706,
      chairShell: 0xffffff,
      chairStem: 0xa8a29e,
      cushion: 0xebdccb,
      cushionTrim: 0xc2410c,
      keyLight: 0xffffff,
      keyIntensity: 2.2,
      fillLight: 0xded5c8,
      fillIntensity: 0.8,
      rimLight: 0xe05615,
      rimIntensity: 2.4,
      sparkColor: 0xc2410c,
    },
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }

  /* =========================================================
     HERO 3D CAT SCENE (Cat nestled in Cat Chair)
     ========================================================= */
  function initHeroCat() {
    const container = document.getElementById("cat-3d-stage");
    if (!container) return;

    if (prefersReducedMotion) {
      container.classList.add("is-fallback");
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("WebGL not available, keeping 2D fallback", err);
      container.classList.add("is-fallback");
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    container.classList.add("is-loaded");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.42, 6.2);

    // Track container dimensions
    let width = container.clientWidth || 340;
    let height = container.clientHeight || 340;

    function resize() {
      width = container.clientWidth || 340;
      height = container.clientHeight || 340;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ---------- Materials Setup ---------- */
    let curTheme = getCurrentTheme();
    const pal = THEMES[curTheme];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: pal.body,
      roughness: pal.bodyRoughness,
      metalness: pal.bodyMetalness,
      flatShading: false,
    });

    const chestMat = new THREE.MeshStandardMaterial({
      color: pal.chest,
      roughness: 0.5,
      metalness: 0.02,
    });

    const innerEarMat = new THREE.MeshStandardMaterial({
      color: pal.innerEar,
      roughness: 0.28,
      emissive: pal.innerEar,
      emissiveIntensity: 0.5,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: pal.eyeGlow,
      emissive: pal.eyeGlow,
      emissiveIntensity: 0.95,
      roughness: 0.12,
    });

    const pupilMat = new THREE.MeshBasicMaterial({
      color: pal.pupil,
    });

    const glintMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const collarMat = new THREE.MeshStandardMaterial({
      color: pal.collar,
      roughness: 0.2,
      metalness: 0.6,
      emissive: pal.collar,
      emissiveIntensity: 0.35,
    });

    const bellMat = new THREE.MeshStandardMaterial({
      color: pal.bell,
      roughness: 0.2,
      metalness: 0.8,
      emissive: pal.bell,
      emissiveIntensity: 0.3,
    });

    const whiskerMat = new THREE.MeshBasicMaterial({
      color: curTheme === "dark" ? 0xdddddd : 0x555555,
      transparent: true,
      opacity: 0.75,
    });

    // Chair Materials
    const chairStemMat = new THREE.MeshStandardMaterial({
      color: pal.chairStem,
      roughness: 0.25,
      metalness: 0.75,
    });

    const chairShellMat = new THREE.MeshStandardMaterial({
      color: pal.chairShell,
      roughness: 0.4,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    const cushionMat = new THREE.MeshStandardMaterial({
      color: pal.cushion,
      roughness: 0.65,
      metalness: 0.05,
    });

    /* =========================================================
       1. MODERN CAT CHAIR CONSTRUCTION
       ========================================================= */
    const chairGroup = new THREE.Group();
    scene.add(chairGroup);
    const BASE_Y = -0.25;
    chairGroup.position.set(0, BASE_Y, 0);

    // Pedestal Base (heavy bevelled metal disc)
    const baseGeo = new THREE.CylinderGeometry(0.72, 0.8, 0.08, 36);
    const baseMesh = new THREE.Mesh(baseGeo, chairStemMat);
    baseMesh.position.set(0, -0.98, 0);
    chairGroup.add(baseMesh);

    // Slim Vertical Support Stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.52, 24);
    const stemMesh = new THREE.Mesh(stemGeo, chairStemMat);
    stemMesh.position.set(0, -0.7, 0);
    chairGroup.add(stemMesh);

    // Swivel Joint Collar
    const jointGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.1, 24);
    const jointMesh = new THREE.Mesh(jointGeo, chairStemMat);
    jointMesh.position.set(0, -0.42, 0);
    chairGroup.add(jointMesh);

    // Pod / Scoop Chair Shell (designer egg lounge cradling the cat)
    const shellGeo = new THREE.SphereGeometry(0.96, 36, 28, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    const shellMesh = new THREE.Mesh(shellGeo, chairShellMat);
    shellMesh.position.set(0, 0.38, -0.15);
    shellMesh.rotation.x = -0.25;
    chairGroup.add(shellMesh);

    // Sleek Metallic Rim tracing the open top of the chair pod
    const rimGeo = new THREE.TorusGeometry(0.94, 0.035, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, chairStemMat);
    rimMesh.position.set(0, 0.56, -0.22);
    rimMesh.rotation.x = -0.25 + Math.PI / 2;
    chairGroup.add(rimMesh);

    // Plush Cushion (nestled cozy interior bed inside the pod)
    const cushionGeo = new THREE.CylinderGeometry(0.75, 0.62, 0.28, 36);
    const cushionMesh = new THREE.Mesh(cushionGeo, cushionMat);
    cushionMesh.position.set(0, 0.05, 0.02);
    cushionMesh.rotation.x = -0.18;
    chairGroup.add(cushionMesh);

    const cushionRimGeo = new THREE.TorusGeometry(0.64, 0.14, 18, 36);
    const cushionRimMesh = new THREE.Mesh(cushionRimGeo, cushionMat);
    cushionRimMesh.position.set(0, 0.18, 0.0);
    cushionRimMesh.rotation.x = -0.18 + Math.PI / 2;
    chairGroup.add(cushionRimMesh);

    /* =========================================================
       2. REALISTIC CAT NESTLED ON CHAIR CUSHION
       ========================================================= */
    const catRoot = new THREE.Group();
    chairGroup.add(catRoot);
    catRoot.position.set(0, 0, 0);

    // Lounging Feline Torso / Curved Back
    const bodyGeo = new THREE.SphereGeometry(0.58, 32, 24);
    bodyGeo.scale(0.95, 0.88, 1.15);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.52, -0.02);
    bodyMesh.rotation.x = 0.16;
    catRoot.add(bodyMesh);

    // Soft Feline Chest
    const chestGeo = new THREE.SphereGeometry(0.38, 24, 20);
    chestGeo.scale(0.88, 1.1, 0.88);
    const chestMesh = new THREE.Mesh(chestGeo, chestMat);
    chestMesh.position.set(0, 0.68, 0.26);
    catRoot.add(chestMesh);

    // Left and Right Hind Haunches (nestled against chair walls)
    const haunchGeo = new THREE.SphereGeometry(0.32, 20, 16);
    haunchGeo.scale(0.68, 1.05, 1.25);

    const leftHaunch = new THREE.Mesh(haunchGeo, bodyMat);
    leftHaunch.position.set(-0.42, 0.42, -0.02);
    leftHaunch.rotation.set(0.18, 0.12, 0.1);

    const rightHaunch = new THREE.Mesh(haunchGeo, bodyMat);
    rightHaunch.position.set(0.42, 0.42, -0.02);
    rightHaunch.rotation.set(0.18, -0.12, -0.1);

    catRoot.add(leftHaunch, rightHaunch);

    // Front Paws (resting neatly over cushion front)
    const pawGeo = new THREE.SphereGeometry(0.12, 16, 12);
    pawGeo.scale(1.0, 0.58, 1.35);

    const leftPaw = new THREE.Mesh(pawGeo, bodyMat);
    leftPaw.position.set(-0.18, 0.28, 0.48);

    const rightPaw = new THREE.Mesh(pawGeo, bodyMat);
    rightPaw.position.set(0.18, 0.28, 0.48);

    // Delicate sculpted toe lobes on paws
    const toeGeo = new THREE.SphereGeometry(0.038, 10, 8);
    toeGeo.scale(1, 0.8, 1.1);

    function addToes(pawMesh) {
      const t1 = new THREE.Mesh(toeGeo, chestMat);
      t1.position.set(-0.05, 0.01, 0.11);
      const t2 = new THREE.Mesh(toeGeo, chestMat);
      t2.position.set(0, 0.015, 0.13);
      const t3 = new THREE.Mesh(toeGeo, chestMat);
      t3.position.set(0.05, 0.01, 0.11);
      pawMesh.add(t1, t2, t3);
    }
    addToes(leftPaw);
    addToes(rightPaw);

    catRoot.add(leftPaw, rightPaw);

    // Collar & Ember Pendant
    const collarGeo = new THREE.TorusGeometry(0.4, 0.036, 12, 32);
    collarGeo.rotateX(Math.PI / 2 + 0.15);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.98, 0.15);
    catRoot.add(collar);

    const gemGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const gem = new THREE.Mesh(gemGeo, bellMat);
    gem.position.set(0, 0.92, 0.52);
    catRoot.add(gem);

    // Curled Tail looping gracefully over chair rim
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0.44, 0.36, -0.06);

    const tailGeo = new THREE.TorusGeometry(0.38, 0.06, 14, 28, Math.PI * 0.95);
    tailGeo.rotateY(Math.PI / 2);
    tailGeo.rotateZ(0.24);
    const tailMesh = new THREE.Mesh(tailGeo, bodyMat);
    tailGroup.add(tailMesh);

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), innerEarMat);
    tailTip.position.set(0.26, -0.2, 0.38);
    tailGroup.add(tailTip);

    catRoot.add(tailGroup);

    /* =========================================================
       3. REALISTIC FELINE HEAD
       ========================================================= */
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.18, 0.18);
    catRoot.add(headGroup);

    // Cranium with anatomical cat slope
    const headGeo = new THREE.SphereGeometry(0.55, 32, 28);
    headGeo.scale(1.08, 0.94, 0.98);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headGroup.add(headMesh);

    // Distinct Cheeks / Feline Jowls
    const cheekGeo = new THREE.SphereGeometry(0.22, 18, 14);
    cheekGeo.scale(1.18, 0.88, 0.88);
    const leftCheek = new THREE.Mesh(cheekGeo, bodyMat);
    leftCheek.position.set(-0.24, -0.12, 0.38);
    const rightCheek = new THREE.Mesh(cheekGeo, bodyMat);
    rightCheek.position.set(0.24, -0.12, 0.38);
    headGroup.add(leftCheek, rightCheek);

    // Tapered Muzzle Whisker Pads
    const muzzlePadGeo = new THREE.SphereGeometry(0.15, 16, 12);
    muzzlePadGeo.scale(1.25, 0.8, 0.95);
    const leftMuzzle = new THREE.Mesh(muzzlePadGeo, chestMat);
    leftMuzzle.position.set(-0.1, -0.16, 0.52);
    const rightMuzzle = new THREE.Mesh(muzzlePadGeo, chestMat);
    rightMuzzle.position.set(0.1, -0.16, 0.52);
    headGroup.add(leftMuzzle, rightMuzzle);

    // Triangular Feline Nose with Nostril Accents
    const noseGeo = new THREE.ConeGeometry(0.062, 0.075, 3);
    noseGeo.rotateZ(Math.PI);
    noseGeo.scale(1.2, 0.8, 0.6);
    const nose = new THREE.Mesh(noseGeo, innerEarMat);
    nose.position.set(0, -0.11, 0.61);
    headGroup.add(nose);

    // Delicate Chin
    const chinGeo = new THREE.SphereGeometry(0.09, 12, 10);
    chinGeo.scale(1, 0.7, 0.8);
    const chin = new THREE.Mesh(chinGeo, bodyMat);
    chin.position.set(0, -0.24, 0.48);
    headGroup.add(chin);

    // Pointed Realistic Ears with Cavity
    const earOuterGeo = new THREE.ConeGeometry(0.24, 0.52, 4);
    earOuterGeo.rotateY(Math.PI / 4);
    earOuterGeo.scale(1, 1, 0.44);

    const leftEar = new THREE.Mesh(earOuterGeo, bodyMat);
    leftEar.position.set(-0.32, 0.46, 0.04);
    leftEar.rotation.set(-0.06, -0.05, 0.3);

    const innerEarGeo = new THREE.ConeGeometry(0.16, 0.38, 4);
    innerEarGeo.rotateY(Math.PI / 4);
    innerEarGeo.scale(1, 1, 0.38);
    const leftInner = new THREE.Mesh(innerEarGeo, innerEarMat);
    leftInner.position.set(0, -0.04, 0.065);
    leftEar.add(leftInner);

    const rightEar = new THREE.Mesh(earOuterGeo, bodyMat);
    rightEar.position.set(0.32, 0.46, 0.04);
    rightEar.rotation.set(-0.06, 0.05, -0.3);

    const rightInner = new THREE.Mesh(innerEarGeo, innerEarMat);
    rightInner.position.set(0, -0.04, 0.065);
    rightEar.add(rightInner);

    headGroup.add(leftEar, rightEar);

    // Expressive Almond Feline Eyes
    const eyeOuterGeo = new THREE.SphereGeometry(0.13, 22, 18);
    eyeOuterGeo.scale(1.22, 0.92, 0.55);

    const leftEye = new THREE.Mesh(eyeOuterGeo, eyeMat);
    leftEye.position.set(-0.24, 0.06, 0.46);
    leftEye.rotation.set(0, -0.12, 0.08);

    const rightEye = new THREE.Mesh(eyeOuterGeo, eyeMat);
    rightEye.position.set(0.24, 0.06, 0.46);
    rightEye.rotation.set(0, 0.12, -0.08);

    // Vertical Cat Slit Pupils (depth tracked in eye socket)
    const pupilGeo = new THREE.SphereGeometry(0.065, 14, 14);
    pupilGeo.scale(0.38, 1.5, 0.42);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.065);
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.065);
    rightEye.add(rightPupil);

    // Specular Catchlights (lifelike soul in eyes)
    const glintGeo = new THREE.SphereGeometry(0.022, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, glintMat);
    leftGlint.position.set(0.04, 0.045, 0.08);
    leftEye.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, glintMat);
    rightGlint.position.set(0.04, 0.045, 0.08);
    rightEye.add(rightGlint);

    headGroup.add(leftEye, rightEye);

    // Multi-tier Graceful Whiskers
    function createWhisker(x, y, z, rotZ, rotY) {
      const g = new THREE.CylinderGeometry(0.004, 0.002, 0.44, 6);
      g.rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, whiskerMat);
      m.position.set(x, y, z);
      m.rotation.set(0, rotY, rotZ);
      return m;
    }
    headGroup.add(createWhisker(-0.38, -0.12, 0.52, 0.12, -0.28));
    headGroup.add(createWhisker(-0.38, -0.17, 0.52, 0.0, -0.28));
    headGroup.add(createWhisker(-0.38, -0.22, 0.52, -0.12, -0.28));
    headGroup.add(createWhisker(0.38, -0.12, 0.52, -0.12, 0.28));
    headGroup.add(createWhisker(0.38, -0.17, 0.52, 0.0, 0.28));
    headGroup.add(createWhisker(0.38, -0.22, 0.52, 0.12, 0.28));

    /* =========================================================
       4. LIGHTING SYSTEM
       ========================================================= */
    const keyLight = new THREE.DirectionalLight(pal.keyLight, pal.keyIntensity);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(pal.fillLight, pal.fillIntensity);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(pal.rimLight, pal.rimIntensity);
    rimLight.position.set(0, -2, -3);
    scene.add(rimLight);

    const heroSpot = new THREE.PointLight(pal.eyeGlow, 1.2, 5);
    heroSpot.position.set(0, 1.2, 1.5);
    scene.add(heroSpot);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    /* =========================================================
       5. INTERACTIVE CLICK REACTION & BURST
       ========================================================= */
    const sparkles = [];
    const sparkGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: pal.sparkColor,
      transparent: true,
      opacity: 0,
    });

    for (let i = 0; i < 28; i++) {
      const s = new THREE.Mesh(sparkGeo, sparkMat.clone());
      s.visible = false;
      scene.add(s);
      sparkles.push({
        mesh: s,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
      });
    }

    function triggerSparkBurst() {
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.mesh.visible = true;
        s.mesh.position.set(
          headGroup.position.x + (Math.random() - 0.5) * 0.4,
          headGroup.position.y + 0.2 + (Math.random() - 0.5) * 0.3,
          headGroup.position.z + 0.4 + (Math.random() - 0.5) * 0.3
        );
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.035 + Math.random() * 0.045;
        s.vx = Math.cos(angle) * speed;
        s.vy = 0.035 + Math.random() * 0.055;
        s.vz = (Math.random() - 0.5) * speed;
        s.life = 0;
        s.maxLife = 35 + Math.floor(Math.random() * 25);
      }
    }

    let boopProgress = 0;
    let isBooping = false;
    let blinkTimer = 0;
    let isBlinking = false;

    function boopCat() {
      isBooping = true;
      boopProgress = 0;
      isBlinking = true;
      blinkTimer = 0;
      triggerSparkBurst();

      const catButton = document.getElementById("cat-button");
      if (catButton) {
        catButton.click();
      }
    }

    container.addEventListener("click", boopCat);
    container.style.cursor = "pointer";

    // Idle spontaneous blinks
    setInterval(function () {
      if (!isBlinking && Math.random() < 0.4) {
        isBlinking = true;
        blinkTimer = 0;
      }
    }, 3800);

    /* =========================================================
       6. THEME TRANSITIONS
       ========================================================= */
    window.addEventListener("hk-themechange", function (e) {
      const nextTheme = e.detail && e.detail.theme ? e.detail.theme : "dark";
      const p = THEMES[nextTheme] || THEMES.dark;

      bodyMat.color.setHex(p.body);
      bodyMat.roughness = p.bodyRoughness;
      bodyMat.metalness = p.bodyMetalness;

      chestMat.color.setHex(p.chest);
      innerEarMat.color.setHex(p.innerEar);
      innerEarMat.emissive.setHex(p.innerEar);

      eyeMat.color.setHex(p.eyeGlow);
      eyeMat.emissive.setHex(p.eyeGlow);
      pupilMat.color.setHex(p.pupil);

      collarMat.color.setHex(p.collar);
      collarMat.emissive.setHex(p.collar);
      bellMat.color.setHex(p.bell);

      chairStemMat.color.setHex(p.chairStem);
      chairShellMat.color.setHex(p.chairShell);
      cushionMat.color.setHex(p.cushion);

      whiskerMat.color.setHex(nextTheme === "dark" ? 0xdddddd : 0x555555);

      keyLight.color.setHex(p.keyLight);
      keyLight.intensity = p.keyIntensity;
      fillLight.color.setHex(p.fillLight);
      fillLight.intensity = p.fillIntensity;
      rimLight.color.setHex(p.rimLight);
      rimLight.intensity = p.rimIntensity;
      heroSpot.color.setHex(p.eyeGlow);

      sparkles.forEach(function (s) {
        s.mesh.material.color.setHex(p.sparkColor);
      });
    });

    /* =========================================================
       7. ANIMATION & RENDER LOOP
       ========================================================= */
    let clock = 0;
    let targetHeadRotY = 0;
    let targetHeadRotX = 0;
    let targetPupilX = 0;
    let targetPupilY = 0;

    function animate() {
      requestAnimationFrame(animate);
      clock += 0.02;

      // Smooth pointer interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Realistic feline head turn limits
      targetHeadRotY = THREE.MathUtils.clamp(mouse.x * 0.65, -0.58, 0.58);
      targetHeadRotX = THREE.MathUtils.clamp(-mouse.y * 0.48, -0.38, 0.32);

      headGroup.rotation.y = THREE.MathUtils.lerp(
        headGroup.rotation.y,
        targetHeadRotY,
        0.1
      );
      headGroup.rotation.x = THREE.MathUtils.lerp(
        headGroup.rotation.x,
        targetHeadRotX,
        0.1
      );

      // Subtle ear twitch
      leftEar.rotation.z =
        0.3 + Math.sin(clock * 1.8) * 0.02 + (mouse.x < -0.3 ? -0.05 : 0);
      rightEar.rotation.z =
        -0.3 + Math.sin(clock * 1.8 + 1) * 0.02 + (mouse.x > 0.3 ? 0.05 : 0);

      // Pupils dynamic tracking in eye socket
      targetPupilX = THREE.MathUtils.clamp(mouse.x * 0.042, -0.035, 0.035);
      targetPupilY = THREE.MathUtils.clamp(mouse.y * 0.036, -0.03, 0.03);
      leftPupil.position.x = THREE.MathUtils.lerp(
        leftPupil.position.x,
        targetPupilX,
        0.15
      );
      leftPupil.position.y = THREE.MathUtils.lerp(
        leftPupil.position.y,
        targetPupilY,
        0.15
      );
      rightPupil.position.x = THREE.MathUtils.lerp(
        rightPupil.position.x,
        targetPupilX,
        0.15
      );
      rightPupil.position.y = THREE.MathUtils.lerp(
        rightPupil.position.y,
        targetPupilY,
        0.15
      );

      // Natural rhythmic breathing expansion
      const breath = Math.sin(clock * 1.6) * 0.018;
      bodyMesh.scale.x = 0.96 + breath;
      bodyMesh.scale.y = 0.88 + breath * 0.8;
      chestMesh.scale.x = 0.88 + breath * 1.2;

      // Gentle organic tail sway over the chair rim
      tailGroup.rotation.z = Math.sin(clock * 1.5) * 0.16 + Math.sin(clock * 3.0) * 0.04;

      // Eye blink handling
      if (isBlinking) {
        blinkTimer += 0.12;
        const blinkScale = Math.abs(Math.sin(blinkTimer * Math.PI));
        const sY = Math.max(0.08, 1 - blinkScale);
        leftEye.scale.y = 0.92 * sY;
        rightEye.scale.y = 0.92 * sY;
        if (blinkTimer >= 1) {
          isBlinking = false;
          leftEye.scale.y = 0.92;
          rightEye.scale.y = 0.92;
        }
      }

      // Boop interaction physics
      if (isBooping) {
        boopProgress += 0.08;
        const boopForward = Math.sin(boopProgress * Math.PI) * 0.24;
        headGroup.position.z = 0.18 + boopForward;
        headGroup.rotation.z = Math.sin(boopProgress * Math.PI * 2) * 0.06;
        if (boopProgress >= 1) {
          isBooping = false;
          headGroup.position.z = 0.18;
          headGroup.rotation.z = 0;
        }
      }

      // Sparkles animation
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        if (!s.mesh.visible) continue;
        s.life++;
        s.mesh.position.x += s.vx;
        s.mesh.position.y += s.vy;
        s.mesh.position.z += s.vz;
        s.vy -= 0.0015;
        s.mesh.material.opacity = Math.max(0, 1 - s.life / s.maxLife);
        s.mesh.scale.multiplyScalar(0.97);
        if (s.life >= s.maxLife) {
          s.mesh.visible = false;
        }
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  /* =========================================================
     NAVBAR MINI 3D CAT LOGO
     ========================================================= */
  function initNavCat() {
    const canvas = document.getElementById("nav-cat-stage");
    if (!canvas || prefersReducedMotion) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
      });
    } catch (e) {
      return;
    }

    renderer.setSize(38, 38);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const navLogo = canvas.closest(".nav-logo");
    if (navLogo) navLogo.classList.add("has-3d-cat");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0, 3.2);

    const light = new THREE.DirectionalLight(0xffffff, 1.8);
    light.position.set(2, 2, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    let curTheme = getCurrentTheme();
    const pal = THEMES[curTheme];

    const headMat = new THREE.MeshStandardMaterial({
      color: pal.body,
      roughness: 0.4,
    });
    const earMat = new THREE.MeshStandardMaterial({
      color: pal.innerEar,
      emissive: pal.innerEar,
      emissiveIntensity: 0.4,
    });
    const eyeMat = new THREE.MeshBasicMaterial({
      color: pal.eyeGlow,
    });

    const miniCat = new THREE.Group();
    scene.add(miniCat);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 14),
      headMat
    );
    miniCat.add(head);

    const earGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
    earGeo.rotateY(Math.PI / 4);
    const lEar = new THREE.Mesh(earGeo, headMat);
    lEar.position.set(-0.45, 0.58, 0);
    lEar.rotation.z = 0.35;
    const rEar = new THREE.Mesh(earGeo, headMat);
    rEar.position.set(0.45, 0.58, 0);
    rEar.rotation.z = -0.35;
    miniCat.add(lEar, rEar);

    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 10);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.28, 0.05, 0.62);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.28, 0.05, 0.62);
    miniCat.add(lEye, rEye);

    window.addEventListener("hk-themechange", function (e) {
      const nextTheme = e.detail && e.detail.theme ? e.detail.theme : "dark";
      const p = THEMES[nextTheme] || THEMES.dark;
      headMat.color.setHex(p.body);
      earMat.color.setHex(p.innerEar);
      earMat.emissive.setHex(p.innerEar);
      eyeMat.color.setHex(p.eyeGlow);
    });

    let navClock = 0;
    function renderNav() {
      requestAnimationFrame(renderNav);
      navClock += 0.03;
      miniCat.rotation.y = THREE.MathUtils.lerp(
        miniCat.rotation.y,
        mouse.x * 0.6,
        0.1
      );
      miniCat.rotation.x = THREE.MathUtils.lerp(
        miniCat.rotation.x,
        -mouse.y * 0.4,
        0.1
      );
      miniCat.position.y = Math.sin(navClock) * 0.04;
      renderer.render(scene, camera);
    }
    renderNav();
  }

  /* =========================================================
     BOOT
     ========================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initHeroCat();
      initNavCat();
    });
  } else {
    initHeroCat();
    initNavCat();
  }
})();
