
(async () => {
  const root = document.documentElement;
  if (!root.classList.contains('welcome-active')) return;
  const welcome = document.querySelector('.welcome');
  const word = welcome.querySelector('.welcome-word');
  const ink = welcome.querySelector('.welcome-ink');
  const destination = document.querySelector('.nav .logo img');
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const animations = [];

  function play(element, keyframes, timing) {
    const animation = element.animate(keyframes, { fill: 'both', ...timing });
    animations.push(animation);
    return animation.finished;
  }
  function finish() {
    root.classList.remove('welcome-active');
    listeners.abort();
    animations.forEach(animation => animation.cancel());
  }
  try {
    if (window.scrollY > 0) return;
    // Let navigation and scrolling take over immediately, even during the intro.
    window.addEventListener('scroll', finish, { ...options, passive: true });
    window.addEventListener('pointerdown', finish, options);
    window.addEventListener('keydown', finish, options);
    window.addEventListener('pagehide', finish, options);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', finish, options);

    const assets = Promise.allSettled([
      document.fonts.ready,
      document.querySelector('.logo img').decode(),
      ...Array.from(welcome.querySelectorAll('img'), image => image.decode())
    ]);
    await Promise.allSettled([...welcome.querySelectorAll('img')].map(image=>image.decode()));
    await Promise.all([
      play(ink, [
        { maskPosition: '100% 0', webkitMaskPosition: '100% 0', filter: 'blur(8px)', opacity: 0, transform: 'translateY(10px)' },
        { maskPosition: '0 0', webkitMaskPosition: '0 0', filter: 'blur(0)', opacity: 1, transform: 'none' }
      ], { duration: 1600, easing: 'cubic-bezier(.22,1,.36,1)' }),
      // Use the available fonts if a remote font request stalls.
      Promise.race([assets, new Promise(resolve => setTimeout(resolve, 1800))])
    ]);
    if (listeners.signal.aborted) return;

    const from = welcome.querySelector('.welcome-symbol').getBoundingClientRect();
    const to = destination.getBoundingClientRect();
    const scale = to.width / from.width;
    const landing = 'translate(' + (to.left - from.left) + 'px, ' +
      (to.top + (to.height - from.height * scale) / 2 - from.top) + 'px) scale(' + scale + ')';
    window.addEventListener('resize', finish, options);
    const ease = 'cubic-bezier(.18, .75, .2, 1)';
    welcome.querySelector('.welcome-tail').style.clipPath='inset(-24px -24px -24px 0)';
    await Promise.all([
      play(welcome.querySelector('.welcome-bullet'), [{opacity:1},{opacity:0}], {duration:240}),
      play(welcome.querySelector('.welcome-tail img'), [{ transform:'translateX(0)' }, { transform:'translateX(-105%)' }], {duration:650,easing:'cubic-bezier(.65,0,.2,1)'}),
      play(word, [{ transform: 'none' }, { transform: landing }], {
        duration: 900, easing: 'cubic-bezier(.65, 0, .2, 1)'
      }),
      play(welcome.querySelector('.welcome-backdrop'), [{ opacity: 1 }, { opacity: 0 }], { delay: 180, duration: 720 }),
      play(destination, [{ opacity: 0 }, { opacity: 1 }], { delay: 900, duration: 180 }),
      play(word, [{ opacity: 1 }, { opacity: 0 }], { delay: 900, duration: 180 }),
      play(document.querySelector('.hero h1'), [
        { clipPath: 'inset(0 0 100% 0)', translate: '0 22px' },
        { clipPath: 'inset(0)', translate: '0 0' }
      ], { delay: 380, duration: 800, easing: ease }),
      play(document.querySelector('.device-stage'), [
        { opacity: 0, translate: '0 52px' }, { opacity: 1, translate: '0 0' }
      ], { delay: 500, duration: 900, easing: ease })
    ]);
  } catch (error) {
    if (error.name !== 'AbortError') console.error(error);
  } finally {
    finish();
  }
})();
