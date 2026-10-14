// Interactive hero: plays hero.mp4 (exported from Google Flow) once each time it scrolls into view.
// The video's white background is removed live: white pixels connected to the frame edge become transparent
// (so teeth, eye whites and shirt highlights inside the character stay), drawn with WebGL over the page.
(function () {
  const card = document.getElementById('heroArt');
  const video = document.getElementById('heroVideo');
  const bubble = document.getElementById('bubble');
  const hint = document.getElementById('touchHint');
  const cut = document.getElementById('heroToon'); // transparent cut-out canvas
  if (!card || !video) return;

  video.muted = true; video.defaultMuted = true; video.volume = 0; // no sound
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let inView = false, lastPlay = -1e9, hideTimer = 0;

  function showBubble(ms) {                      // pops in with a springy bounce each time
    clearTimeout(hideTimer);
    bubble.classList.remove('show', 'pop'); void bubble.offsetWidth;
    bubble.classList.add('show', 'pop');
    hideTimer = setTimeout(() => bubble.classList.remove('show', 'pop'), ms);
  }
  function play() {
    const now = performance.now(); if (now - lastPlay < 1200) return; lastPlay = now;
    if (reduce) { showBubble(4500); return; }
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => showBubble(4500));
    setTimeout(() => showBubble(Math.min(6000, (video.duration || 6) * 800)), 300);
  }

  // ---- background removal -------------------------------------------------
  const CROP = 0.0065;                            // the file has thin black encoder rows at the top/bottom edge
  const MW = 512, MH = 288;                       // working resolution for the mask
  const mc = document.createElement('canvas'); mc.width = MW; mc.height = MH;
  const mctx = mc.getContext('2d', { willReadFrequently: true });
  const mask = new Uint8Array(MW * MH), tmp = new Uint8Array(MW * MH), stack = new Int32Array(MW * MH);
  let lastMask = null, gl = null, prog = null, vTex = null, mTex = null, U = {}, dirty = true;

  function buildMask() {
    const vh = video.videoHeight, vw = video.videoWidth;
    mctx.drawImage(video, 0, vh * CROP, vw, vh * (1 - 2 * CROP), 0, 0, MW, MH);
    const d = mctx.getImageData(0, 0, MW, MH).data;
    const n = MW * MH, strict = new Uint8Array(n), loose = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      if (mx - mn < 34) { if (mn > 232) strict[i] = 1; if (mn > 168) loose[i] = 1; }   // loose = pale anti-aliased fringe
    }
    mask.fill(255);                                // 255 = keep, 0 = background
    let sp = 0;
    const seed = i => { if (strict[i] && mask[i]) { mask[i] = 0; stack[sp++] = i; } };
    const spread = () => {
      while (sp) {
        const i = stack[--sp], x = i % MW;
        if (x > 0) seed(i - 1); if (x < MW - 1) seed(i + 1); if (i >= MW) seed(i - MW); if (i < n - MW) seed(i + MW);
      }
    };
    for (let x = 0; x < MW; x++) { seed(x); seed((MH - 1) * MW + x); }
    for (let y = 0; y < MH; y++) { seed(y * MW); seed(y * MW + MW - 1); }
    spread();                                       // 1) white connected to the frame edge
    // 2) white pockets enclosed by the character (e.g. between arm and body): big ones are background,
    //    small ones (eye whites, teeth, highlights) stay.
    const BIG = Math.round(n * 0.0009), seen = new Uint8Array(n), comp = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      if (!strict[i] || !mask[i] || seen[i]) continue;
      let cs = 0, sp2 = 0; stack[sp2++] = i; seen[i] = 1;
      while (sp2) {
        const j = stack[--sp2]; comp[cs++] = j; const x = j % MW;
        if (x > 0 && strict[j - 1] && mask[j - 1] && !seen[j - 1]) { seen[j - 1] = 1; stack[sp2++] = j - 1; }
        if (x < MW - 1 && strict[j + 1] && mask[j + 1] && !seen[j + 1]) { seen[j + 1] = 1; stack[sp2++] = j + 1; }
        if (j >= MW && strict[j - MW] && mask[j - MW] && !seen[j - MW]) { seen[j - MW] = 1; stack[sp2++] = j - MW; }
        if (j < n - MW && strict[j + MW] && mask[j + MW] && !seen[j + MW]) { seen[j + MW] = 1; stack[sp2++] = j + MW; }
      }
      if (cs > BIG) for (let k = 0; k < cs; k++) mask[comp[k]] = 0;
    }
    for (let pass = 0; pass < 3; pass++) {          // 3) eat the pale halo around the outline
      tmp.set(mask);
      for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
        const i = y * MW + x;
        if (mask[i] && loose[i] && (!mask[i - 1] || !mask[i + 1] || !mask[i - MW] || !mask[i + MW])) tmp[i] = 0;
      }
      mask.set(tmp);
    }
    tmp.set(mask);                                  // 4) pull the edge in one more pixel so no white rim survives
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
      const i = y * MW + x;
      if (mask[i] && (!mask[i - 1] || !mask[i + 1] || !mask[i - MW] || !mask[i + MW])) tmp[i] = 0;
    }
    mask.set(tmp);
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {   // light blur = soft edge
      const i = y * MW + x;
      tmp[i] = (mask[i] * 4 + mask[i - 1] + mask[i + 1] + mask[i - MW] + mask[i + MW]) / 8;
    }
    for (let x = 0; x < MW; x++) { tmp[x] = mask[x]; tmp[(MH - 1) * MW + x] = mask[(MH - 1) * MW + x]; }
    for (let y = 0; y < MH; y++) { tmp[y * MW] = mask[y * MW]; tmp[y * MW + MW - 1] = mask[y * MW + MW - 1]; }
    return tmp;
  }

  function initGL() {
    gl = cut && cut.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return false;
    const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;
      uniform sampler2D tex; uniform sampler2D mask; uniform vec2 fit; varying vec2 uv;
      void main(){
        vec2 c = (uv - .5) * fit + .5; c.y = 1. - c.y;
        vec3 col = texture2D(tex, vec2(c.x, ${CROP} + c.y * (1. - 2. * ${CROP}))).rgb;
        float a = smoothstep(.42, .8, texture2D(mask, c).r);
        gl_FragColor = vec4(col * a, a);
      }`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return false;
    prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mk = unit => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
      return t;
    };
    vTex = mk(0); mTex = mk(1);
    gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'mask'), 1);
    U.fit = gl.getUniformLocation(prog, 'fit');
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    return true;
  }
  function resizeCut() {
    const d = Math.min(devicePixelRatio || 1, 2);
    cut.width = Math.max(2, Math.round(card.clientWidth * d)); cut.height = Math.max(2, Math.round(card.clientHeight * d)); dirty = true;
  }
  function render() {
    if (!gl || video.readyState < 2 || !video.videoWidth) return;
    let m; try { m = buildMask(); } catch (e) { return; }
    lastMask = m;
    gl.viewport(0, 0, cut.width, cut.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, vTex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); } catch (e) { return; }
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MW, MH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, m);
    const va = video.videoWidth / video.videoHeight, ca = cut.width / cut.height;
    gl.uniform2f(U.fit, ca > va ? 1 : ca / va, ca > va ? va / ca : 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  let lastT = -1;
  function loop() {
    requestAnimationFrame(loop);
    if (!inView || document.hidden) return;
    if (dirty || video.currentTime !== lastT) { lastT = video.currentTime; dirty = false; render(); }
  }
  if (initGL()) {
    card.classList.add('keyed');
    resizeCut(); new ResizeObserver(resizeCut).observe(card);
    video.addEventListener('loadeddata', () => { dirty = true; }); video.addEventListener('seeked', () => { dirty = true; });
    requestAnimationFrame(loop);
  }

  // ---- play once every time the hero comes back into view (stops on the last frame, no loop)
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !inView) { dirty = true; play(); } inView = v; }, { threshold: 0.35 }).observe(card);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && inView) play(); });
  // ---- touch / click the character: the wave plays and the greeting pops
  function onCharacter(e) {
    if (!lastMask || !video.videoWidth) return true;            // no mask (fallback): whole card counts
    const r = (cut || card).getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return false;
    const va = video.videoWidth / video.videoHeight, ca = r.width / r.height;
    const fx = ca > va ? 1 : ca / va, fy = ca > va ? va / ca : 1;
    const cx = (px - 0.5) * fx + 0.5, cy = (py - 0.5) * fy + 0.5;
    if (cx < 0 || cx > 1 || cy < 0 || cy > 1) return false;
    return lastMask[Math.min(MH - 1, Math.floor(cy * MH)) * MW + Math.min(MW - 1, Math.floor(cx * MW))] > 110;
  }
  card.addEventListener('pointerdown', e => {
    if (!onCharacter(e)) return;
    lastPlay = -1e9; play(); showBubble(4500);
    if (hint) hint.classList.add('gone');
  });
  card.addEventListener('pointermove', e => { card.style.cursor = onCharacter(e) ? 'pointer' : 'default'; });

  // ---- pointer tilt (3D parallax)
  if (!reduce && matchMedia('(hover: hover)').matches) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }
})();
