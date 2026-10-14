// 3D welcome character for the Falcon Fashion landing page (Three.js).
// Pixar-style boy built in code. To use your own model instead, drop a .glb at public/guy.glb.
(function () {
  const canvas = document.getElementById('scene');
  const bubble = document.getElementById('bubble');
  if (!window.THREE) { bubble.textContent = 'Hello! Welcome to Falcon Fashion 👋'; bubble.classList.add('show'); return; }

  const GREETING = 'Hello! Welcome to Falcon Fashion.';
  const C = { skin: 0xefb797, skinDark: 0xd9967a, hair: 0x6a4228, jacket: 0x3b4d6b, tee: 0x8c4b35, strap: 0xc47b4e, cream: 0xe8dcc8 };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const BASE_Z = 5.0;
  camera.position.set(0, 1.85, BASE_Z);
  camera.lookAt(0, 1.85, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4a58, 0.95));
  const key = new THREE.DirectionalLight(0xfff3e0, 1.0); key.position.set(2.5, 4, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.35); fill.position.set(-4, 1, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xd4a017, 0.9); rim.position.set(-4, 3, -3); scene.add(rim);

  const lin = c => new THREE.Color(c).convertSRGBToLinear(); // hex colours are sRGB; the renderer outputs sRGB
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: 0.65, metalness: 0 }, o));
  const loader = new THREE.TextureLoader();

  const guy = new THREE.Group(); scene.add(guy);
  const add = (parent, geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); parent.add(o); return o;
  };
  const sph = (r = 1) => new THREE.SphereGeometry(r, 32, 24);
  const skinM = mat(C.skin, { roughness: 0.55 });
  const jacketM = mat(C.jacket, { roughness: 0.85 });

  // ---- torso: navy open hoodie jacket over a brown tee, backpack straps, falcon emblem
  const TZ = 0.62, TR = 0.55; // torso depth scale, radius
  const torso = new THREE.Group(); torso.position.y = 0.6; guy.add(torso);
  add(torso, new THREE.CylinderGeometry(TR * 0.92, TR, 1.25, 40), jacketM, 0, 0, 0, 1, 1, TZ);
  // arcs of cylinder hugging the torso front: tee strip, zipper edges, backpack straps
  const arc = (rad, th0, thLen, color, rough) => {
    const g = new THREE.CylinderGeometry(rad, rad * 1.07, 1.2, 32, 1, true, th0, thLen);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: lin(color), roughness: rough, side: THREE.DoubleSide }));
    m.scale.set(1, 1, TZ); m.position.y = -0.01; torso.add(m);
  };
  arc(TR * 0.94, -0.38, 0.76, C.tee, 0.8);
  arc(TR * 0.95, -0.41, 0.025, C.cream, 0.4);
  arc(TR * 0.95, 0.385, 0.025, C.cream, 0.4);
  arc(TR * 0.96, -0.86, 0.2, C.strap, 0.6);
  arc(TR * 0.96, 0.66, 0.2, C.strap, 0.6);
  // hood bunched behind the neck
  const hood = add(torso, new THREE.TorusGeometry(0.3, 0.13, 16, 32), jacketM, 0, 0.66, -0.05);
  hood.rotation.x = Math.PI / 2 - 0.45;
  for (const s of [-1, 1]) add(torso, sph(0.2), jacketM, s * 0.55, 0.5, 0, 1, 1, 0.9); // shoulders
  // falcon emblem on the jacket (brand!)
  loader.load('mark.png', t => {
    t.encoding = THREE.sRGBEncoding;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22 * t.image.height / t.image.width), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    const a = -0.62;
    p.position.set(Math.sin(a) * TR * 0.96, 0.1, Math.cos(a) * TR * TZ * 0.96 + 0.01); p.rotation.y = a * 0.6; torso.add(p);
  });
  add(guy, new THREE.CylinderGeometry(0.1, 0.12, 0.34, 20), skinM, 0, 1.78, 0); // neck

  // ---- arms
  function makeArm(side, withHand) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.66, 1.08, 0); guy.add(shoulder);
    add(shoulder, new THREE.CylinderGeometry(0.15, 0.14, 0.6, 20), jacketM, 0, -0.3, 0);
    const elbow = new THREE.Group(); elbow.position.set(0, -0.6, 0); shoulder.add(elbow);
    add(elbow, sph(0.145), jacketM);
    add(elbow, new THREE.CylinderGeometry(0.14, 0.125, 0.4, 20), jacketM, 0, -0.2, 0);
    add(elbow, new THREE.CylinderGeometry(0.1, 0.1, 0.18, 20), skinM, 0, -0.45, 0); // wrist
    const hand = new THREE.Group(); hand.position.set(0, -0.58, 0); elbow.add(hand);
    add(hand, sph(0.105), skinM, 0, -0.04, 0, 1, 1.05, 0.65);
    if (withHand) { // open hand: four fingers + thumb
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

  // ---- head
  const head = new THREE.Group(); head.position.y = 2.18; guy.add(head);
  const R = 0.52;
  add(head, sph(R), skinM, 0, 0, 0, 1.0, 0.98, 0.96);
  add(head, sph(R * 0.58), skinM, 0, -0.27, 0.1, 1.0, 0.78, 0.85); // soft chin / jaw
  for (const s of [-1, 1]) { // big cartoon ears
    add(head, sph(0.14), mat(C.skinDark, { roughness: 0.6 }), s * R * 0.97, -0.02, -0.02, 0.45, 1.1, 0.8);
    add(head, sph(0.085), mat(0xc8765c), s * R * 1.0, -0.02, 0.0, 0.3, 0.9, 0.6);
  }
  add(head, sph(0.085), mat(0xe7a08a, { roughness: 0.5 }), 0, -0.12, R * 0.93, 1.05, 0.9, 0.9); // nose
  // hair: base cap + swept quiff + tufts
  const hairM = mat(C.hair, { roughness: 0.55, metalness: 0.05 });
  const cap = add(head, new THREE.SphereGeometry(R * 1.07, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.46), hairM);
  cap.rotation.x = -0.5; cap.position.y = 0.03;
  add(head, new THREE.SphereGeometry(R * 1.07, 32, 20, Math.PI * 1.5 - 1.3, 2.6, Math.PI * 0.1, Math.PI * 0.6), hairM);
  const tuft = (x, y, z, sx, sy, sz, rx, ry, rz) => { const o = add(head, sph(0.2), hairM, x, y, z, sx, sy, sz); o.rotation.set(rx, ry, rz); };
  tuft(0.02, 0.5, 0.22, 1.2, 0.95, 1.4, -0.7, 0, -0.15); // front quiff
  tuft(-0.18, 0.56, 0.12, 0.85, 1.35, 0.85, -0.35, 0, 0.35);
  tuft(0.2, 0.58, 0.08, 0.8, 1.5, 0.85, -0.3, 0, -0.45);
  tuft(0.02, 0.62, -0.05, 0.9, 1.3, 0.9, -0.2, 0, 0);
  tuft(-0.36, 0.3, 0.05, 0.6, 1.0, 0.8, 0, 0, 0.3);
  tuft(0.38, 0.3, 0.05, 0.6, 1.0, 0.8, 0, 0, -0.3);
  for (const s of [-1, 1]) tuft(s * 0.47, 0.0, 0.02, 0.35, 0.8, 0.55, 0, 0, 0); // sideburns

  // face texture: big eyes, brows, freckles, smile (open + blink versions)
  function paintFace(blink) {
    const W = 512, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#efb797'; g.fillRect(0, 0, W, H);
    const blush = (x, y) => {
      const r = g.createRadialGradient(x, y, 4, x, y, 70); r.addColorStop(0, 'rgba(226,120,110,.55)'); r.addColorStop(1, 'rgba(226,120,110,0)');
      g.fillStyle = r; g.fillRect(x - 80, y - 80, 160, 160);
    };
    blush(105, 400); blush(407, 400);
    g.fillStyle = 'rgba(160,90,60,.5)';
    [[130, 365], [148, 380], [122, 388], [382, 365], [364, 380], [390, 388], [256, 330]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); });
    for (const s of [-1, 1]) {
      const ex = 256 + s * 112, ey = 305;
      if (blink) {
        g.strokeStyle = '#3a2418'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(ex, ey - 8, 40, 0.2, Math.PI - 0.2); g.stroke();
      } else {
        g.fillStyle = '#fbf6f1'; g.beginPath(); g.ellipse(ex, ey, 56, 54, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(120,70,50,.5)'; g.lineWidth = 3; g.stroke();
        const ir = g.createRadialGradient(ex + s * 2, ey + 4, 4, ex, ey + 4, 38); ir.addColorStop(0, '#5b3a22'); ir.addColorStop(1, '#2a180d');
        g.fillStyle = ir; g.beginPath(); g.arc(ex, ey + 4, 37, 0, 7); g.fill();
        g.fillStyle = '#0c0705'; g.beginPath(); g.arc(ex, ey + 4, 22, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 11, ey - 10, 10, 0, 7); g.fill(); g.beginPath(); g.arc(ex + 12, ey + 16, 5, 0, 7); g.fill();
        g.strokeStyle = '#3a2418'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.ellipse(ex, ey, 58, 56, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); // upper lid
      }
      g.strokeStyle = '#5a3720'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath();
      g.moveTo(ex - s * 62, ey - 62); g.quadraticCurveTo(ex, ey - 98, ex + s * 62, ey - 66 - s * 8); g.stroke(); // brows
    }
    g.strokeStyle = 'rgba(190,110,90,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(236, 385); g.quadraticCurveTo(256, 402, 276, 385); g.stroke(); // nose base
    g.strokeStyle = '#9a4a3c'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(190, 480); g.quadraticCurveTo(256, 530, 326, 470); g.stroke(); // smile
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const faceOpen = paintFace(false), faceBlink = paintFace(true);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceOpen, roughness: 0.55 });
  add(head, new THREE.SphereGeometry(R * 1.012, 48, 40, Math.PI / 2 - 0.75, 1.5, Math.PI * 0.2, Math.PI * 0.56), faceMat, 0, 0, 0, 1.0, 0.98, 0.96);

  // ---- optional real 3D person (public/guy.glb)
  let actor = guy, rigged = null;
  function bonesOf(root) {
    const b = {}; root.traverse(o => { if (o.isBone) b[o.name.replace(/^mixamorig[:_]?/i, '')] = o; });
    return b;
  }
  function calibrate(arm, hand) {
    const wy = o => { o.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y; };
    const rest = arm.rotation.clone(); let best = { gain: 0, axis: 'z', sign: 1 };
    for (const axis of ['x', 'y', 'z']) for (const sign of [1, -1]) {
      const y0 = wy(hand); arm.rotation[axis] += 0.3 * sign; const g = wy(hand) - y0; arm.rotation.copy(rest);
      if (g > best.gain) best = { gain: g, axis, sign };
    }
    const shoulderY = wy(arm), len = Math.abs(wy(hand) - shoulderY) + 0.0001;
    let angle = 0; const target = shoulderY + Math.max(len, 0.3) * 0.75;
    for (; angle < 3; angle += 0.05) { arm.rotation[best.axis] = rest[best.axis] + angle * best.sign; if (wy(hand) >= target) break; }
    arm.rotation.copy(rest);
    return { arm, rest, axis: best.axis, sign: best.sign, up: angle };
  }
  if (THREE.GLTFLoader) new THREE.GLTFLoader().load('guy.glb', gltf => {
    const model = new THREE.Group(), root = gltf.scene; model.add(root); scene.add(model);
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
    const bones = bonesOf(root), fullBody = !!(bones.Hips || bones.Spine) && size.y > size.x * 1.3;
    const k = (fullBody ? 2.7 : 2.0) / size.y, top = 2.75;
    root.scale.multiplyScalar(k);
    const b2 = new THREE.Box3().setFromObject(root), c = b2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, top - b2.max.y, -c.z);
    guy.visible = false; actor = model;
    const arm = bones.RightArm || bones.LeftArm, hand = bones.RightHand || bones.LeftHand;
    model.updateMatrixWorld(true);
    if (arm && hand) rigged = calibrate(arm, hand);
  }, undefined, () => {});

  // ---- speech
  let voice = null;
  const pickVoice = () => {
    const v = speechSynthesis.getVoices();
    voice = v.find(x => /en/i.test(x.lang) && /male|david|daniel|alex|guy|mark|george/i.test(x.name)) || v.find(x => /^en/i.test(x.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  let speaking = false, spokeOnce = false;
  function speak() {
    spokeOnce = true;
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(GREETING);
    if (voice) u.voice = voice; u.rate = 0.95; u.pitch = 1.15;
    u.onstart = () => speaking = true; u.onend = u.onerror = () => speaking = false;
    speechSynthesis.speak(u);
  }

  // ---- animation timeline
  let t0 = performance.now(), bubbled = false;
  const ease = x => 1 - Math.pow(1 - x, 3);
  const TWIRL = 2.2, WAVE_START = 2.3, WAVE_END = 10;
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; });
  function replay() { t0 = performance.now(); bubble.classList.remove('show'); bubbled = false; speak(); }
  canvas.addEventListener('click', replay);
  document.getElementById('hear').addEventListener('click', e => { e.stopPropagation(); speak(); });
  // Browsers block speech until the visitor interacts, so greet on the first tap/key.
  const first = () => { if (!spokeOnce) speak(); removeEventListener('pointerdown', first); removeEventListener('keydown', first); };
  addEventListener('pointerdown', first); addEventListener('keydown', first);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = BASE_Z * Math.max(1, 1.55 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nextBlink = 2500, blinkUntil = 0;
  function frame(now) {
    const t = (now - t0) / 1000;
    const pop = reduce ? 1 : Math.min(1, t / 0.7);
    actor.scale.setScalar(ease(pop));
    actor.rotation.y = reduce ? 0 : (1 - ease(Math.min(1, t / TWIRL))) * Math.PI * 4;
    actor.position.y = (t < TWIRL && !reduce) ? Math.abs(Math.sin(t * 3.2)) * 0.18 * (1 - t / TWIRL) : Math.sin(now / 900) * 0.025;

    const waving = t > WAVE_START && t < WAVE_END;
    const raise = waving ? ease(Math.min(1, (t - WAVE_START) / 0.5)) : (t >= WAVE_END ? 1 - ease(Math.min(1, (t - WAVE_END) / 0.6)) : 0);
    if (rigged && rigged.arm) rigged.arm.rotation[rigged.axis] = rigged.rest[rigged.axis] + rigged.sign * (raise * rigged.up + raise * Math.sin(now / 130) * 0.22);
    waveArm.shoulder.rotation.z = 0.08 + raise * 2.2;
    waveArm.elbow.rotation.z = raise * (-0.5 + Math.sin(now / 110) * 0.5);
    waveArm.hand.rotation.z = raise * Math.sin(now / 110 + 1) * 0.25;
    leftArm.shoulder.rotation.z = -0.18 - Math.sin(now / 900) * 0.02;

    head.rotation.y += ((mouse.x * 0.5 + (waving ? 0.12 : 0)) - head.rotation.y) * 0.08;
    head.rotation.x += ((mouse.y * 0.25 + (speaking ? Math.sin(now / 130) * 0.08 : 0)) - head.rotation.x) * 0.1;
    head.rotation.z = Math.sin(now / 1500) * 0.03 + (waving ? 0.05 : 0);

    if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2500 + Math.random() * 2500; }
    const want = now < blinkUntil ? faceBlink : faceOpen;
    if (faceMat.map !== want) { faceMat.map = want; faceMat.needsUpdate = true; }

    if (!bubbled && t > WAVE_START) { bubbled = true; bubble.classList.add('show'); }
    if (t > WAVE_END + 4) bubble.classList.remove('show');
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
