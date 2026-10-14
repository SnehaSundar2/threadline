// Interactive hero: plays hero.mp4 (exported from Google Flow) once each time it scrolls into view.
// A WebGL "anime" shader (cel-shaded colour bands + ink outlines) restyles the video live; the toggle switches it off.
(function () {
  const card = document.getElementById('heroArt');
  const video = document.getElementById('heroVideo');
  const bubble = document.getElementById('bubble');
  const replayBtn = document.getElementById('replay');
  const soundBtn = document.getElementById('sound');
  const styleBtn = document.getElementById('style');
  const toon = document.getElementById('heroToon');
  if (!card || !video) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let inView = false, lastPlay = -1e9, hideTimer = 0;

  function showBubble(ms) {
    bubble.classList.add('show'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function play() {
    const now = performance.now(); if (now - lastPlay < 1200) return; lastPlay = now;
    bubble.classList.remove('show');
    if (reduce) { showBubble(4500); return; }
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => showBubble(4500)); // autoplay blocked: just greet
    setTimeout(() => showBubble(Math.min(6000, (video.duration || 6) * 800)), 300);
  }

  // ---- anime look: real-time cel-shading (flattened colour bands + outlines) on a WebGL canvas
  let animeOn = true, gl = null, prog = null, tex = null, U = {};
  function initToon() {
    if (!toon) return false;
    gl = toon.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!gl) return false;
    const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;
      uniform sampler2D tex; uniform vec2 texel; uniform vec2 fit; uniform float amount;
      varying vec2 uv;
      vec3 at(vec2 c, vec2 o){ return texture2D(tex, c + o * texel).rgb; }
      float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
      void main(){
        vec2 c = (uv - .5) * fit + .5; c.y = 1. - c.y;            // cover-fit + flip
        vec3 orig = texture2D(tex, c).rgb;
        vec3 b = (at(c,vec2(-1.5,-1.5))+at(c,vec2(0.,-1.5))+at(c,vec2(1.5,-1.5))
                 +at(c,vec2(-1.5,0.))+orig*2.+at(c,vec2(1.5,0.))
                 +at(c,vec2(-1.5,1.5))+at(c,vec2(0.,1.5))+at(c,vec2(1.5,1.5))) / 10.;   // smooth skin
        float l = lum(b);
        float bands = 5.;
        float f = l * bands, i = floor(f);
        float q = (i + smoothstep(.35,.65,fract(f))) / bands;     // soft-edged colour bands
        vec3 col = b * (q / max(l, .02));
        float g = lum(col);
        col = mix(vec3(g), col, 1.45);                             // vivid anime saturation
        col = (col - .5) * 1.05 + .54;                             // gentle contrast, lift
        // ink outlines (Sobel on luminance)
        float tl=lum(at(c,vec2(-3.5,-3.5))), t=lum(at(c,vec2(0.,-3.5))), tr=lum(at(c,vec2(3.5,-3.5)));
        float ml=lum(at(c,vec2(-3.5,0.))), mr=lum(at(c,vec2(3.5,0.)));
        float bl=lum(at(c,vec2(-3.5,3.5))), bm=lum(at(c,vec2(0.,3.5))), br=lum(at(c,vec2(3.5,3.5)));
        float gx = -tl - 2.*ml - bl + tr + 2.*mr + br;
        float gy = -tl - 2.*t - tr + bl + 2.*bm + br;
        float edge = smoothstep(.42,.85,length(vec2(gx,gy)));
        col = mix(col, vec3(.07,.05,.1), edge * .7);
        gl_FragColor = vec4(mix(orig, clamp(col,0.,1.), amount), 1.);
      }`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return false;
    prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
    for (const n of ['texel', 'fit', 'amount']) U[n] = gl.getUniformLocation(prog, n);
    return true;
  }
  function resizeToon() {
    const d = Math.min(devicePixelRatio || 1, 2);
    toon.width = Math.max(2, Math.round(card.clientWidth * d)); toon.height = Math.max(2, Math.round(card.clientHeight * d));
  }
  function draw() {
    requestAnimationFrame(draw);
    if (!gl || !inView || document.hidden || video.readyState < 2 || !video.videoWidth) return;
    gl.viewport(0, 0, toon.width, toon.height);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); } catch (e) { return; }
    const va = video.videoWidth / video.videoHeight, ca = toon.width / toon.height;
    gl.uniform2f(U.texel, 1 / video.videoWidth, 1 / video.videoHeight);
    gl.uniform2f(U.fit, ca > va ? 1 : ca / va, ca > va ? va / ca : 1);
    gl.uniform1f(U.amount, animeOn ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  // The video is already anime, so the live filter is off unless the card has data-anime-filter (for realistic footage).
  const toonReady = card.hasAttribute('data-anime-filter') && initToon();
  if (toonReady) {
    card.classList.add('toon'); resizeToon(); new ResizeObserver(resizeToon).observe(card);
    // WebGL needs a pixel-format hint for videos; flip handled in the shader
    requestAnimationFrame(draw);
  }
  if (styleBtn) {
    if (!toonReady) styleBtn.hidden = true; // no filter = no toggle
    styleBtn.addEventListener('click', e => {
      e.stopPropagation(); animeOn = !animeOn;
      styleBtn.textContent = animeOn ? '🎨 Original' : '🎨 Anime';
    });
  }

  // play once every time the hero comes back into view (stops on the last frame, no loop)
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !inView) play(); inView = v; }, { threshold: 0.35 }).observe(card);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && inView) play(); });

  if (replayBtn) replayBtn.addEventListener('click', e => { e.stopPropagation(); lastPlay = -1e9; play(); });
  if (soundBtn) soundBtn.addEventListener('click', e => {
    e.stopPropagation(); video.muted = !video.muted;
    soundBtn.textContent = video.muted ? '🔇 Sound on' : '🔊 Sound off';
    if (!video.muted) { lastPlay = -1e9; play(); }
  });
  card.addEventListener('click', () => { lastPlay = -1e9; play(); });

  // pointer tilt (3D parallax)
  if (!reduce && matchMedia('(hover: hover)').matches) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
      card.style.setProperty('--gx', (x + 0.5) * 100 + '%'); card.style.setProperty('--gy', (y + 0.5) * 100 + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }
})();
