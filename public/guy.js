// 3D welcome character for Falcon Fashion (Three.js).
// Pixar-style boy built in code. He waves once each time he comes back into view.
// To use your own model instead, drop a .glb at public/guy.glb.
(function () {
  const canvas = document.getElementById('scene');
  const bubble = document.getElementById('bubble');
  if (!window.THREE) { bubble.textContent = 'Hello! Welcome to Falcon Fashion 👋'; bubble.classList.add('show'); return; }

  const GREETING = 'Hello! Welcome to Falcon Fashion.';
  const C = { skin: 0xa4673f, skinDark: 0x9c5f45, hair: 0x120d0b, hairLight: 0x2b211d, brow: 0x140d0a, jacket: 0x15151a, cream: 0xe8dcc8 };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const BASE_Z = 5.0;
  camera.position.set(0, 1.85, BASE_Z);
  camera.lookAt(0, 1.85, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x4a4a62, 0.8));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.15); key.position.set(2.5, 4.5, 6);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -1, near: 0.5, far: 18 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.4); fill.position.set(-4, 1.5, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xd4a017, 1.1); rim.position.set(-4, 3, -3); scene.add(rim);

  const lin = c => new THREE.Color(c).convertSRGBToLinear(); // hex colours are sRGB; renderer outputs sRGB
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: 0.65, metalness: 0 }, o));
  const skinM = new THREE.MeshPhysicalMaterial({ color: lin(C.skin), roughness: 0.5, clearcoat: 0.04, clearcoatRoughness: 0.7, sheen: lin(0x7a4a30) });
  const teeM = mat(C.jacket, { roughness: 0.95 });
  const loader = new THREE.TextureLoader();

  const guy = new THREE.Group(); scene.add(guy);
  const add = (parent, geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); parent.add(o); return o;
  };
  const sph = (r = 1) => new THREE.SphereGeometry(r, 32, 24);

  // ---- torso: black tee with the grey striped graphic, collar and a thin chain
  const TZ = 0.62, TR = 0.55;
  const torso = new THREE.Group(); torso.position.y = 0.6; guy.add(torso);
  add(torso, new THREE.CylinderGeometry(TR * 0.92, TR, 1.25, 40), teeM, 0, 0, 0, 1, 1, TZ);
  add(torso, new THREE.CylinderGeometry(0.17, TR * 0.92, 0.5, 40), teeM, 0, 0.87, 0, 1, 1, TZ); // shoulders sloping up to the neck
  for (const s of [-1, 1]) add(torso, sph(0.2), teeM, s * 0.55, 0.5, 0, 1, 1, 0.9);
  const collar = add(torso, new THREE.TorusGeometry(0.17, 0.035, 12, 32), mat(0x0d0d10, { roughness: 0.9 }), 0, 1.1, 0);
  collar.rotation.x = Math.PI / 2; collar.scale.y = TZ;
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const q = gc.getContext('2d');
  q.fillStyle = '#26262d'; q.beginPath(); q.moveTo(20, 20); q.lineTo(236, 20); q.lineTo(236, 150); q.lineTo(128, 240); q.lineTo(20, 150); q.closePath(); q.fill();
  q.fillStyle = '#b9bcc4';
  for (let x = 30; x < 232; x += 16) { const b = x < 128 ? 150 + (x - 20) * 0.83 : 240 - (x - 128) * 0.83; q.fillRect(x, 36, 8, b - 46); }
  const gt = new THREE.CanvasTexture(gc); gt.encoding = THREE.sRGBEncoding; gt.anisotropy = 4;
  const gArc = 0.62;
  const graphic = add(torso, new THREE.CylinderGeometry(TR * 0.955, TR * 0.955, 0.62, 24, 1, true, -gArc / 2, gArc), new THREE.MeshStandardMaterial({ map: gt, transparent: true, roughness: 0.8 }), 0, 0.2, 0.004, 1, 1, TZ);
  void graphic;
  add(guy, new THREE.CylinderGeometry(0.1, 0.125, 0.4, 24), skinM, 0, 1.8, 0); // neck
  const chain = add(guy, new THREE.TorusGeometry(0.145, 0.006, 8, 40), mat(0xd5d8df, { metalness: 0.85, roughness: 0.25 }), 0, 1.66, 0.02);
  chain.rotation.x = Math.PI / 2 - 0.25; chain.scale.y = 0.85;

  // ---- arms
  function makeArm(side, withHand) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.66, 1.08, 0); guy.add(shoulder);
    add(shoulder, new THREE.CylinderGeometry(0.17, 0.165, 0.34, 24), teeM, 0, -0.14, 0); // short sleeve
    add(shoulder, new THREE.CylinderGeometry(0.128, 0.115, 0.4, 24), skinM, 0, -0.4, 0);
    const elbow = new THREE.Group(); elbow.position.set(0, -0.6, 0); shoulder.add(elbow);
    add(elbow, sph(0.115), skinM);
    add(elbow, new THREE.CylinderGeometry(0.115, 0.088, 0.5, 24), skinM, 0, -0.25, 0);
    const hand = new THREE.Group(); hand.position.set(0, -0.58, 0); elbow.add(hand);
    add(hand, sph(0.105), skinM, 0, -0.04, 0, 1, 1.05, 0.65);
    if (withHand) { // watch + open hand: four fingers + thumb
      add(elbow, new THREE.CylinderGeometry(0.098, 0.098, 0.065, 24), mat(0x0e0e11, { roughness: 0.5 }), 0, -0.44, 0);
      add(elbow, new THREE.BoxGeometry(0.1, 0.06, 0.03), mat(0x0e0e11, { roughness: 0.3, metalness: 0.4 }), 0, -0.44, 0.105);
      [-0.075, -0.025, 0.025, 0.075].forEach((x, i) => {
        const f = new THREE.Group(); f.position.set(x, -0.11, 0); f.rotation.z = -x * 2.2; hand.add(f);
        const len = [0.1, 0.12, 0.115, 0.09][i];
        add(f, new THREE.CylinderGeometry(0.026, 0.028, len, 10), skinM, 0, -len / 2, 0);
        add(f, sph(0.027), skinM, 0, -len, 0);
      });
      const th = new THREE.Group(); th.position.set(side * -0.1, -0.03, 0.01); th.rotation.z = side * 0.9; hand.add(th);
      add(th, new THREE.CylinderGeometry(0.03, 0.032, 0.09, 10), skinM, 0, -0.045, 0);
      add(th, sph(0.03), skinM, 0, -0.09, 0);
    }
    return { shoulder, elbow, hand };
  }
  const leftArm = makeArm(-1, false), waveArm = makeArm(1, true);
  leftArm.elbow.rotation.x = -0.55;

  // ---- head (a touch oversized, Pixar-style)
  const head = new THREE.Group(); head.position.y = 2.2; head.scale.setScalar(1.12); guy.add(head);
  const R = 0.52;
  const onFace = (x, y) => 0.96 * Math.sqrt(Math.max(0.01, R * R - x * x - y * y));
  add(head, sph(R), skinM, 0, 0, 0, 1.0, 0.98, 0.96);
  add(head, sph(R * 0.58), skinM, 0, -0.27, 0.1, 1.0, 0.78, 0.85); // soft chin
  for (const s of [-1, 1]) { // ears
    add(head, sph(0.14), mat(C.skinDark, { roughness: 0.6 }), s * R * 0.97, -0.02, -0.02, 0.45, 1.1, 0.8);
    add(head, sph(0.085), mat(0xa8664b), s * R * 1.0, -0.02, 0.0, 0.3, 0.9, 0.6);
  }
  add(head, sph(0.078), mat(0xc48762, { roughness: 0.45 }), 0, -0.105, onFace(0, -0.105) + 0.025, 1.05, 0.9, 0.9); // nose

  // eyes: 3D eyeballs that follow the visitor, with eyelids that blink
  const eyes = [], lids = [];
  const white = mat(0xfaf5ee, { roughness: 0.2 });
  for (const s of [-1, 1]) {
    const ex = s * 0.2, ey = 0.03, ez = onFace(ex, ey) - 0.07;
    const eye = new THREE.Group(); eye.position.set(ex, ey, ez); head.add(eye); eyes.push(eye);
    add(eye, sph(0.128), white);
    const cap = (ang, color, r, rough) => { const m = add(eye, new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, ang), mat(color, { roughness: rough })); m.rotation.x = Math.PI / 2; };
    cap(0.66, 0x3a2112, 0.1285, 0.3); cap(0.36, 0x0a0605, 0.1292, 0.2); // iris, pupil
    const hl = (x, y, r) => add(eye, sph(r), new THREE.MeshBasicMaterial({ color: 0xffffff }), x, y, 0.117); hl(-0.034, 0.04, 0.021); hl(0.036, -0.03, 0.011);
    const lid = new THREE.Group(); lid.position.set(ex, ey, ez); head.add(lid);
    const dome = add(lid, new THREE.SphereGeometry(0.138, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), skinM);
    lids.push(lid); void dome;
    // eyebrow (inner end lifted for a gentle, curious look)
    const pts = [[s * 0.09, 0.225], [s * 0.2, 0.248], [s * 0.31, 0.2]].map(([x, y]) => new THREE.Vector3(x, y, onFace(x, y) + 0.012));
    add(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.032, 8), mat(C.brow, { roughness: 0.7 }));
  }
  // open mouth (shown while he talks)
  const mouth = add(head, sph(0.075), mat(0x4a1010, { roughness: 0.6 }), 0, -0.26, onFace(0, -0.26) + 0.004, 1.15, 0.5, 0.35); mouth.visible = false;
  const tongue = add(head, sph(0.04), mat(0xd9655f, { roughness: 0.6 }), 0, -0.285, onFace(0, -0.285) + 0.006, 1.2, 0.5, 0.3); tongue.visible = false;

  // hair: black swept-up quiff, shorter sides
  const hairM = mat(C.hair, { roughness: 0.4, metalness: 0.1 }), hairL = mat(C.hairLight, { roughness: 0.4, metalness: 0.1 });
  const cap = add(head, new THREE.SphereGeometry(R * 1.06, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.4), hairM);
  cap.rotation.x = -0.4; cap.position.y = 0.05;
  add(head, new THREE.SphereGeometry(R * 1.05, 32, 20, Math.PI * 1.5 - 1.15, 2.3, Math.PI * 0.1, Math.PI * 0.5), hairM);
  const tuft = (m, x, y, z, sx, sy, sz, rx, ry, rz) => { const o = add(head, sph(0.2), m, x, y, z, sx, sy, sz); o.rotation.set(rx, ry, rz); };
  tuft(hairM, 0.0, 0.56, 0.18, 1.5, 1.1, 1.5, -0.8, 0, 0);
  tuft(hairL, 0.08, 0.63, 0.22, 1.2, 1.3, 1.2, -0.9, 0, -0.3);
  tuft(hairM, -0.12, 0.6, 0.15, 1.0, 1.4, 1.1, -0.7, 0, 0.4);
  tuft(hairM, 0.2, 0.55, 0.1, 0.9, 1.2, 1.0, -0.4, 0, -0.6);
  tuft(hairL, -0.25, 0.5, 0.12, 0.8, 1.0, 0.9, -0.3, 0, 0.7);
  tuft(hairM, 0.05, 0.66, 0.0, 1.0, 1.2, 1.1, -0.5, 0, 0);
  tuft(hairM, 0.32, 0.42, 0.0, 0.6, 0.9, 0.8, 0, 0, -0.5);
  tuft(hairM, -0.32, 0.42, 0.0, 0.6, 0.9, 0.8, 0, 0, 0.5);
  for (const s of [-1, 1]) tuft(hairM, s * 0.47, -0.02, 0.04, 0.22, 0.7, 0.4, 0, 0, 0); // sideburns

  // face skin details: light stubble, moustache, big grin (eyes/brows/nose are real 3D)
  const W = 512, H = 640, fc = document.createElement('canvas'); fc.width = W; fc.height = H; const g = fc.getContext('2d');
  g.fillStyle = '#a4673f'; g.fillRect(0, 0, W, H);
  const glow = (x, y, r, rgba) => { const q2 = g.createRadialGradient(x, y, 2, x, y, r); q2.addColorStop(0, rgba); q2.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)')); g.fillStyle = q2; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  glow(91, 405, 80, 'rgba(200,100,80,.35)'); glow(421, 405, 80, 'rgba(200,100,80,.35)');
  glow(125, 322, 70, 'rgba(70,35,22,.25)'); glow(387, 322, 70, 'rgba(70,35,22,.25)'); // eye-socket shading
  g.fillStyle = 'rgba(15,10,8,.38)';
  for (let i = 0; i < 900; i++) { const x = 90 + Math.random() * 332, y = 440 + Math.random() * 190; const dx = (x - 256) / 170, dy = (y - 500) / 130; if (dx * dx + dy * dy < 1) { g.beginPath(); g.arc(x, y, 1.1 + Math.random(), 0, 7); g.fill(); } }
  g.strokeStyle = 'rgba(20,12,10,.75)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(160, 486); g.quadraticCurveTo(256, 462, 352, 486); g.stroke(); // moustache
  g.fillStyle = '#4a1612'; g.beginPath(); g.moveTo(138, 496); g.quadraticCurveTo(256, 640, 374, 496); g.quadraticCurveTo(256, 534, 138, 496); g.fill(); // open smile
  g.fillStyle = '#f7f2ea'; g.beginPath(); g.moveTo(146, 499); g.quadraticCurveTo(256, 540, 366, 499); g.quadraticCurveTo(256, 590, 146, 499); g.fill(); // teeth
  g.strokeStyle = 'rgba(60,24,18,.6)'; g.lineWidth = 5; g.beginPath(); g.moveTo(138, 496); g.quadraticCurveTo(256, 640, 374, 496); g.stroke();
  g.strokeStyle = 'rgba(50,25,18,.5)'; g.lineWidth = 5; g.beginPath(); g.arc(388, 488, 15, 4.2, 5.4); g.stroke(); g.beginPath(); g.arc(124, 488, 15, 4.0, 5.2); g.stroke(); // smile lines
  const faceTex = new THREE.CanvasTexture(fc); faceTex.encoding = THREE.sRGBEncoding; faceTex.anisotropy = 4;
  add(head, new THREE.SphereGeometry(R * 1.012, 48, 40, Math.PI / 2 - 0.75, 1.5, Math.PI * 0.2, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0, 0, 0, 1.0, 0.98, 0.96).userData.noCast = true;

  guy.traverse(o => { if (o.isMesh) { o.castShadow = !o.userData.noCast; o.receiveShadow = true; } });

  // ---- optional real 3D person (public/guy.glb)
  let actor = guy, rigged = null;
  const bonesOf = root => { const b = {}; root.traverse(o => { if (o.isBone) b[o.name.replace(/^mixamorig[:_]?/i, '')] = o; }); return b; };
  function calibrate(arm, hand) {
    const wy = o => { o.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y; };
    const rest = arm.rotation.clone(); let best = { gain: 0, axis: 'z', sign: 1 };
    for (const axis of ['x', 'y', 'z']) for (const sign of [1, -1]) {
      const y0 = wy(hand); arm.rotation[axis] += 0.3 * sign; const gain = wy(hand) - y0; arm.rotation.copy(rest);
      if (gain > best.gain) best = { gain, axis, sign };
    }
    const shoulderY = wy(arm), len = Math.abs(wy(hand) - shoulderY) + 0.0001;
    let angle = 0; const target = shoulderY + Math.max(len, 0.3) * 0.75;
    for (; angle < 3; angle += 0.05) { arm.rotation[best.axis] = rest[best.axis] + angle * best.sign; if (wy(hand) >= target) break; }
    arm.rotation.copy(rest);
    return { arm, rest, axis: best.axis, sign: best.sign, up: angle };
  }
  if (THREE.GLTFLoader) new THREE.GLTFLoader().load('guy.glb', gltf => {
    const model = new THREE.Group(), root = gltf.scene; model.add(root); scene.add(model);
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    const bones = bonesOf(root), fullBody = !!(bones.Hips || bones.Spine) && size.y > size.x * 1.3;
    root.scale.multiplyScalar((fullBody ? 2.7 : 2.0) / size.y);
    const b2 = new THREE.Box3().setFromObject(root), c = b2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, 2.75 - b2.max.y, -c.z);
    guy.visible = false; actor = model;
    const arm = bones.RightArm || bones.LeftArm, hand = bones.RightHand || bones.LeftHand;
    model.updateMatrixWorld(true);
    if (arm && hand) rigged = calibrate(arm, hand);
  }, undefined, () => {});

  // ---- speech
  let voice = null, speaking = false, interacted = false, pendingSpeak = false;
  const pickVoice = () => {
    const v = speechSynthesis.getVoices();
    voice = v.find(x => /en/i.test(x.lang) && /male|david|daniel|alex|guy|mark|george/i.test(x.name)) || v.find(x => /^en/i.test(x.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak() {
    pendingSpeak = false;
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(GREETING);
    if (voice) u.voice = voice; u.rate = 0.95; u.pitch = 1.15;
    u.onstart = () => speaking = true; u.onend = u.onerror = () => speaking = false;
    speechSynthesis.speak(u);
  }
  // Browsers block speech until the visitor interacts with the page.
  const canSpeak = () => interacted || (navigator.userActivation && navigator.userActivation.hasBeenActive);
  const onFirstTouch = () => { interacted = true; if (pendingSpeak) speak(); removeEventListener('pointerdown', onFirstTouch); removeEventListener('keydown', onFirstTouch); };
  addEventListener('pointerdown', onFirstTouch); addEventListener('keydown', onFirstTouch);

  // ---- timeline: one wave each time he comes into focus
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = x => 1 - Math.pow(1 - x, 3);
  const TWIRL = 2.2, WAVE_LEN = 3.0;
  let started = false, intro = true, t0 = 0, lastPlay = -1e9, bubbled = false, spoken = false;
  function play() {
    const now = performance.now(); if (now - lastPlay < 1500) return;
    intro = !started; started = true; lastPlay = t0 = now; bubbled = spoken = false; bubble.classList.remove('show');
  }
  let inView = false;
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !inView) play(); inView = v; }, { threshold: 0.25 }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && inView) play(); });
  addEventListener('focus', () => { if (inView) play(); });
  canvas.addEventListener('click', () => { lastPlay = -1e9; play(); });
  const hear = document.getElementById('hear'); if (hear) hear.addEventListener('click', e => { e.stopPropagation(); interacted = true; speak(); });

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; });
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = BASE_Z * Math.max(1, 1.55 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const LID_OPEN = -0.55, LID_SHUT = 0.85;
  let nextBlink = 2500, blinkUntil = 0;
  function frame(now) {
    const t = started ? (now - t0) / 1000 : 0;
    const WS = intro && !reduce ? 2.3 : 0.25;               // wave starts after the twirl on the first visit
    const waving = started && t > WS && t < WS + WAVE_LEN;
    const up = t < WS ? 0 : ease(Math.min(1, (t - WS) / 0.4));
    const down = t > WS + WAVE_LEN ? ease(Math.min(1, (t - WS - WAVE_LEN) / 0.5)) : 0;
    const raise = up * (1 - down);
    const swing = Math.sin(Math.max(0, t - WS) * 9);

    actor.scale.setScalar(!started ? 0 : (intro && !reduce ? ease(Math.min(1, t / 0.7)) : 1));
    actor.rotation.y = intro && !reduce ? (1 - ease(Math.min(1, t / TWIRL))) * Math.PI * 4 : 0;
    actor.position.y = intro && !reduce && t < TWIRL ? Math.abs(Math.sin(t * 3.2)) * 0.18 * (1 - t / TWIRL)
      : Math.sin(now / 900) * 0.025 + (started && !intro ? Math.abs(Math.sin(t * 7)) * 0.07 * Math.max(0, 1 - t / 0.45) : 0);

    if (rigged && rigged.arm) rigged.arm.rotation[rigged.axis] = rigged.rest[rigged.axis] + rigged.sign * (raise * rigged.up + raise * swing * 0.22);
    waveArm.shoulder.rotation.z = 0.08 + raise * 2.2;
    waveArm.elbow.rotation.z = raise * (-0.5 + swing * 0.5);
    waveArm.hand.rotation.z = raise * Math.sin(Math.max(0, t - WS) * 9 + 1) * 0.25;
    leftArm.shoulder.rotation.z = -0.18 - Math.sin(now / 900) * 0.02;

    const talking = speaking || (waving && t < WS + 1.6);
    head.rotation.y += ((mouse.x * 0.5 + (waving ? 0.12 : 0)) - head.rotation.y) * 0.08;
    head.rotation.x += ((mouse.y * 0.25 + (talking ? Math.sin(now / 130) * 0.06 : 0)) - head.rotation.x) * 0.1;
    head.rotation.z = Math.sin(now / 1500) * 0.03 + (waving ? 0.05 : 0);
    mouth.visible = tongue.visible = talking;
    if (talking) { const o = 0.35 + Math.abs(Math.sin(now / 95)) * 0.65; mouth.scale.y = 0.2 + o * 0.5; tongue.scale.y = 0.15 + o * 0.35; }
    for (const e of eyes) { e.rotation.y += (mouse.x * 0.3 - e.rotation.y) * 0.15; e.rotation.x += (mouse.y * 0.22 - e.rotation.x) * 0.15; }

    if (now > nextBlink) { blinkUntil = now + 150; nextBlink = now + 2200 + Math.random() * 2800; }
    const b = blinkUntil - now, k = b > 0 ? 1 - Math.abs(b - 75) / 75 : 0;
    for (const l of lids) l.rotation.x = LID_OPEN + (LID_SHUT - LID_OPEN) * k;

    if (started && t > WS && !bubbled) { bubbled = true; bubble.classList.add('show'); }
    if (started && t > WS && !spoken) { spoken = true; canSpeak() ? speak() : (pendingSpeak = true); }
    if (t > WS + WAVE_LEN + 1.5) bubble.classList.remove('show');
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
