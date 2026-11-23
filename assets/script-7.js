
(() => {
  const form = document.getElementById('f');
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('span');
  const feedback = form.querySelector('.inquiry-feedback');
  const success = form.querySelector('.inquiry-success');
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || form.classList.contains('submitted') || !form.reportValidity()) return;
    if (location.protocol === 'file:') {
      feedback.textContent = 'Email submission requires the web version of this page. Open the local web preview or the published website, then submit your inquiry.';
      feedback.hidden = false;
      return;
    }
    sending = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…';
    feedback.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const data = Object.fromEntries(new FormData(form));
      data._url = location.href.split('#')[0];
      const response = await fetch('https://formsubmit.co/ajax/webysrilanka@gmail.com', {
        method: 'POST', body: JSON.stringify(data),
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) {
        throw new Error(typeof result.message === 'string' ? result.message : 'The email service did not accept the inquiry. Please try again.');
      }
      form.style.minHeight = form.getBoundingClientRect().height + 'px';
      form.classList.add('submitted');
      success.hidden = false;
      success.focus({preventScroll: true});
    } catch (error) {
      feedback.textContent = error.name === 'AbortError'
        ? 'Confirmation is taking too long. Your inquiry may have arrived. Please try again later or email webysrilanka@gmail.com.'
        : error instanceof TypeError
          ? 'Unable to reach the email service. Check your connection or email webysrilanka@gmail.com.'
          : error instanceof SyntaxError
            ? 'The email service returned an unexpected response. Please try again later.'
            : error.message;
      feedback.hidden = false;
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      label.textContent = 'Send inquiry';
      form.removeAttribute('aria-busy');
    }
  });
})();
