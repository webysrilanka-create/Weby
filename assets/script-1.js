
(() => {
  const track = document.querySelector('.hero-track');
  const hero = track.querySelector('.hero');
  const nav = document.querySelector('.nav');
  const compact = matchMedia('(max-width: 900px)');
  const captions = hero.querySelectorAll('.meta');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let animate = false;
  let start = 0;
  let distance = 1;
  let previousProgress = -1;
  let lastFrameTime = null;
  let frame = 0;

  function paint(now) {
    frame = 0;
    const offset = Math.max(0, window.scrollY);
    const away = offset > start;
    if (nav.inert !== away) {
      nav.inert = away;
      nav.classList.toggle('nav-away', away);
    }
    const target = animate ? clamp((offset - start) / distance) : 0;
    let progress = target;
    if (previousProgress >= 0 && animate) {
      // Ease toward the scroll position at the same rate on every refresh rate.
      const elapsed = lastFrameTime === null ? 1000 / 60 : now - lastFrameTime;
      const remainder = (previousProgress - target) * Math.exp(-elapsed / 115);
      if (Math.abs(remainder) * distance > 0.25) {
        progress = target + remainder;
        schedule();
      }
    }
    lastFrameTime = frame ? now : null;
    if (progress === previousProgress) return;
    previousProgress = progress;
    const turn = 1 - Math.pow(1 - clamp(progress / .88), 1.5);
    hero.style.setProperty('--progress', progress);
    hero.style.setProperty('--scale', .82 + .18 * turn);
    hero.style.setProperty('--yaw', (27 * (1 - turn)) + 'deg');
    hero.style.setProperty('--roll', (7 * (1 - turn)) + 'deg');
    const opacity = 1 - clamp((progress - .52) / .28);
    hero.style.setProperty('--meta-opacity', opacity);
    for (const caption of captions) {
      caption.inert = opacity === 0;
      caption.setAttribute('aria-hidden', String(opacity === 0));
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function measure() {
    animate = !reduced.matches && !compact.matches;
    track.classList.toggle('motion-ready', animate);
    start = track.getBoundingClientRect().top + window.scrollY;
    distance = Math.max(1, track.offsetHeight - hero.offsetHeight);
    previousProgress = -1;
    schedule();
  }
  measure();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  reduced.addEventListener('change', measure);
})();
