const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error("Failed: " + src));
    document.head.appendChild(s);
  });
}

(async function boot() {
  try {
    await loadScript("./three.min.js");
  } catch (e1) {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js");
    } catch (e2) {
      console.error(e2);
      const mount = document.getElementById("sphereMount");
      if (mount) {
        mount.innerHTML =
          "<div style='padding:18px;color:#556070'>Impossibile caricare la libreria 3D (three.js).</div>";
      }
      return;
    }
  }

  window.sphereReady = true;

  const laboratoriPage = document.getElementById("laboratori");
  if (laboratoriPage && laboratoriPage.classList.contains("active")) {
    initSphere();
  }
})();

function initSphere() {
  const container = document.getElementById("sphereMount");
  if (!container) return;
  if (container.querySelector("canvas")) return;
  if (typeof THREE === "undefined") return;

  const BLU_SCURO = 0x00387c;
  const BLU_CHIARO = 0x193f92;

  const SUN_CORE = 0xfff2b3;
  const SUN_MID = 0xffc84a;
  const SUN_EDGE = 0xff8a1c;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  scene.add(new THREE.AmbientLight(0xffffff, 1.05));

  const key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(3, 3, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(BLU_CHIARO, 0.22);
  fill.position.set(-3, 1.5, 2);
  scene.add(fill);

  const sunLight = new THREE.PointLight(SUN_CORE, 1.2, 10);
  sunLight.position.set(0.2, 0.1, 2.2);
  scene.add(sunLight);

  const globe = new THREE.Group();
  scene.add(globe);

  const sphereRadius = 0.56;
  const sphereGeo = new THREE.SphereGeometry(sphereRadius, 96, 96);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: SUN_MID,
    roughness: 0.35,
    metalness: 0.0,
    emissive: SUN_EDGE,
    emissiveIntensity: 0.55
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  globe.add(sphere);

  const glowGeo = new THREE.SphereGeometry(sphereRadius * 1.1, 96, 96);
  const glowMat = new THREE.MeshBasicMaterial({
    color: SUN_MID,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide
  });
  globe.add(new THREE.Mesh(glowGeo, glowMat));

  const haloGeo = new THREE.SphereGeometry(sphereRadius * 1.18, 96, 96);
  const haloMat = new THREE.MeshBasicMaterial({
    color: SUN_EDGE,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  globe.add(new THREE.Mesh(haloGeo, haloMat));

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const width = ctx.measureText(test).width;
      if (width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines;
  }

  function makeLabelSprite(item) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const titleFontSize = 22;
    const bodyFontSize = 15;
    const lineGap = 8;
    const padX = 18;
    const padY = 14;
    const radius = 18;
    const maxTextWidth = 240;

    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");

    const titleFont = `700 ${titleFontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const bodyFont = `500 ${bodyFontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;

    ctx.font = bodyFont;
    const bodyLines = wrapText(ctx, item.body, maxTextWidth);

    ctx.font = titleFont;
    const titleWidth = ctx.measureText(item.title).width;

    ctx.font = bodyFont;
    let longestBody = 0;
    for (const line of bodyLines) {
      longestBody = Math.max(longestBody, ctx.measureText(line).width);
    }

    const textWidth = Math.max(titleWidth, longestBody);
    const w = Math.ceil(textWidth + padX * 2);
    const h = Math.ceil(
      padY +
      titleFontSize +
      10 +
      bodyLines.length * bodyFontSize +
      (bodyLines.length - 1) * 6 +
      padY
    );

    tmp.width = Math.ceil(w * dpr);
    tmp.height = Math.ceil(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 0, 0, w, h, radius);

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0,56,124,0.12)";
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,255,255,0.78)");
    g.addColorStop(0.55, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    let y = padY;

    ctx.font = titleFont;
    ctx.fillStyle = "#0f1c4d";
    ctx.textBaseline = "top";
    ctx.fillText(item.title, padX, y);

    y += titleFontSize + lineGap;

    ctx.font = bodyFont;
    ctx.fillStyle = "#445064";
    for (const line of bodyLines) {
      ctx.fillText(line, padX, y);
      y += bodyFontSize + 6;
    }

    const tex = new THREE.CanvasTexture(tmp);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(mat);

    const baseHeight = 0.42;
    const aspect = w / h;
    sprite.scale.set(baseHeight * aspect, baseHeight, 1);

    return sprite;
  }

  const items = [
    {
      title: "💻 Esercitazioni Pratiche",
      body: "Risoluzione di problemi aziendali reali portati dai mentor."
    },
    {
      title: "📊 Case Study",
      body: "Analisi di come le aziende gestiscono i dati e affrontano la transizione ecologica."
    },
    {
      title: "🗣️ Momenti Significativi",
      body: "Confronto aperto sui talenti personali e su come valorizzare le proprie attitudini."
    },
    {
      title: "📸 Documentazione",
      body: "Creazione di grafici, mappe mentali e raccolta di screenshot durante le sessioni interattive."
    },
    {
      title: "🤝 Collaborazione",
      body: "Lavoro di gruppo e scambio di idee per trovare soluzioni condivise."
    },
    {
      title: "🧠 Competenze",
      body: "Sviluppo di capacità tecniche, organizzative e comunicative."
    }
  ];

  function fibonacciPoints(n) {
    const pts = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }

  const labels = [];
  const labelRadius = sphereRadius * 2.05;
  const pts = fibonacciPoints(items.length);

  for (let i = 0; i < items.length; i++) {
    const sprite = makeLabelSprite(items[i]);
    sprite.position.copy(pts[i].clone().multiplyScalar(labelRadius));
    globe.add(sprite);
    labels.push(sprite);
  }

  const floatBaseY = globe.position.y;
  const t0 = performance.now();

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;

  const rotateSpeed = 0.005;
  const damping = 0.92;
  const autoRotate = 0.0004;

  const canvas = renderer.domElement;

  function point(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function down(e) {
    dragging = true;
    const p = point(e);
    lastX = p.x;
    lastY = p.y;
  }

  function move(e) {
    if (!dragging) return;

    const p = point(e);
    const dx = p.x - lastX;
    const dy = p.y - lastY;

    lastX = p.x;
    lastY = p.y;

    globe.rotation.y += dx * rotateSpeed;
    globe.rotation.x += dy * rotateSpeed;

    velX = dx * rotateSpeed;
    velY = dy * rotateSpeed;

    const maxX = Math.PI * 0.32;
    globe.rotation.x = Math.max(-maxX, Math.min(maxX, globe.rotation.x));
  }

  function up() {
    dragging = false;
  }

  canvas.addEventListener("mousedown", down);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: false });
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);

  function resizeToContainer() {
    const rect = container.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(320, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resizeToContainer);
  ro.observe(container);
  resizeToContainer();

  function animate() {
    requestAnimationFrame(animate);

    const t = (performance.now() - t0) * 0.001;
    globe.position.y = floatBaseY + Math.sin(t * 0.9) * 0.025;
    globe.rotation.z = Math.sin(t * 0.6) * 0.01;

    if (!dragging) {
      globe.rotation.y += autoRotate + velX;
      globe.rotation.x += velY;
      velX *= damping;
      velY *= damping;

      const maxX = Math.PI * 0.32;
      globe.rotation.x = Math.max(-maxX, Math.min(maxX, globe.rotation.x));
    } else {
      velX *= 0.8;
      velY *= 0.8;
    }

    for (const s of labels) {
      const worldPos = new THREE.Vector3();
      s.getWorldPosition(worldPos);

      const toCam = camera.position.clone().sub(worldPos).normalize();
      const normalApprox = worldPos.clone().normalize();
      const facing = normalApprox.dot(toCam);

      s.material.opacity = facing > 0 ? 1.0 : 0.18;
    }

    renderer.render(scene, camera);
  }

  animate();
}