// Interactive hero: plays public/hero.mp4 (exported from Google Flow) once each time it scrolls into view.
// Until hero.mp4 exists it shows the still photo (hero-poster.jpg) with the same greeting + tilt effects.
(function () {
  const card = document.getElementById('heroArt');
  const video = document.getElementById('heroVideo');
  const bubble = document.getElementById('bubble');
  const replayBtn = document.getElementById('replay');
  const soundBtn = document.getElementById('sound');
  if (!card || !video) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hasVideo = true, inView = false, lastPlay = -1e9, hideTimer = 0;

  video.addEventListener('error', () => { hasVideo = false; card.classList.add('no-video'); }, true);
  const src = video.querySelector('source');
  if (src) src.addEventListener('error', () => { hasVideo = false; card.classList.add('no-video'); });

  function showBubble(ms) {
    bubble.classList.add('show'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function play() {
    const now = performance.now(); if (now - lastPlay < 1200) return; lastPlay = now;
    bubble.classList.remove('show');
    if (hasVideo && !reduce) {
      video.currentTime = 0;
      const p = video.play();
      if (p && p.catch) p.catch(() => { hasVideo = false; card.classList.add('no-video'); showBubble(4500); });
      setTimeout(() => showBubble(Math.min(6000, ((video.duration || 6) * 1000) * 0.8)), 400);
    } else {
      card.classList.remove('wave'); void card.offsetWidth; card.classList.add('wave'); // CSS wiggle for the still photo
      showBubble(4500);
    }
  }

  // wave/play once every time the hero comes back into view
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
