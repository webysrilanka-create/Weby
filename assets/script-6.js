
(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const dot = document.createElement('div');
  dot.className = 'custom-cursor cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'custom-cursor cursor-ring';
  ring.innerHTML = '<span>DRAG</span>';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);
  let x = 0, y = 0, followX = 0, followY = 0, frame = 0, lastTime = 0;
  let active = false;
  function render(now) {
    const elapsed = Math.min(50, now - (lastTime || now - 16));
    lastTime = now;
    const ease = 1 - Math.exp(-elapsed / 65);
    followX += (x - followX) * ease;
    followY += (y - followY) * ease;
    ring.style.transform = 'translate3d(' + (followX - 20) + 'px,' + (followY - 20) + 'px,0)';
    frame = Math.abs(x-followX) + Math.abs(y-followY) > .1 ? requestAnimationFrame(render) : 0;
  }
  function hide() {
    active = false;
    document.documentElement.classList.remove('cursor-ready');
    dot.classList.remove('visible');
    ring.classList.remove('visible', 'pressed');
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  document.addEventListener('pointermove', event => {
    if (!enabled.matches || event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    if (!active) {
      followX = x; followY = y; active = true;
      document.documentElement.classList.add('cursor-ready');
      dot.classList.add('visible'); ring.classList.add('visible');
    }
    dot.style.transform = 'translate3d(' + (x - 2.5) + 'px,' + (y - 2.5) + 'px,0)';
    const target = event.target;
    ring.classList.toggle('drag', Boolean(target.closest('#preview-drum')));
    ring.classList.toggle('field', Boolean(target.closest('input, textarea, [contenteditable="true"]')));
    ring.classList.toggle('link', Boolean(target.closest('a, button, select, [role="button"]')));
    if (!frame) { lastTime = 0; frame = requestAnimationFrame(render); }
  }, {passive: true});
  document.addEventListener('pointerdown', () => { if (active) ring.classList.add('pressed'); });
  document.addEventListener('pointerup', () => ring.classList.remove('pressed'));
  document.addEventListener('pointercancel', hide);
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hide(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  enabled.addEventListener('change', hide);
})();
