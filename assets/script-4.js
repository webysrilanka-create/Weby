
(() => {
  const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  for (const card of document.querySelectorAll('.service-card')) {
    card.addEventListener('pointermove', event => {
      if (!motion.matches || event.pointerType === 'touch') return;
      const bounds = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      card.style.setProperty('--tilt-x', (0.5 - y) * 9 + 'deg');
      card.style.setProperty('--tilt-y', (x - 0.5) * 10 + 'deg');
      card.style.setProperty('--light-x', x * 100 + '%');
      card.style.setProperty('--light-y', y * 100 + '%');
    });
  }
})();
