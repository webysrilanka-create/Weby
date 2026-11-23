
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    let cardDelay = 0;
    for (const {target, intersectionRatio} of entries) {
      if (intersectionRatio < 0.12) continue;
      observer.unobserve(target);
      target.classList.remove('reveal-pending');
      if (reducedMotion.matches) continue;
      const card = target.classList.contains('service-card');
      target.animate(!card ? [
        { clipPath: 'inset(0 0 100% 0)', translate: '0 22px' },
        { clipPath: 'inset(0)', translate: '0 0' }
      ] : [
        { opacity: 0, translate: '0 28px' },
        { opacity: 1, translate: '0 0' }
      ], {
        duration: card ? 1100 : 1250, delay: card ? cardDelay : 0,
        easing: 'cubic-bezier(.35,.05,.2,1)', fill: 'backwards'
      });
      if (card) cardDelay += 140;
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.preview-heading h2, .preview-heading p, #services-title, #services .service-card').forEach(item => {
    item.classList.add('reveal-pending');
    observer.observe(item);
  });
})();
