/* Progressive enhancement: all public content is usable without JavaScript. */
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-navigation');
  const header = document.querySelector('.site-header');
  const progress = document.getElementById('scroll-progress-bar');
  const t = (key, fallback) => window.__?.(key) || fallback;
  if (menu && nav) {
    const close = (returnFocus = false) => {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', t('shared.open_menu', 'Open navigation'));
      nav.classList.remove('is-open');
      if (returnFocus) menu.focus();
    };
    menu.setAttribute('aria-label', t('shared.open_menu', 'Open navigation'));
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', t(open ? 'shared.close_menu' : 'shared.open_menu', open ? 'Close navigation' : 'Open navigation'));
      nav.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') close(true);
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) close(nav.contains(document.activeElement));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close(false)));
    window.matchMedia('(min-width: 1181px)').addEventListener('change', () => close(false));
  }
  let frame;
  const updateScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 110);
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${distance > 0 ? window.scrollY / distance * 100 : 0}%`;
    frame = null;
  };
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateScroll); }, {passive:true});
  updateScroll();
  document.querySelectorAll('.copy-email').forEach(button => {
    button.addEventListener('click', async () => {
      const status = button.parentElement.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText('nelson6114007@gmail.com');
        status.textContent = t('shared.copied', 'Email address copied.');
      } catch { status.textContent = t('shared.copy_failed', 'Select and copy the email address above.'); }
    });
  });
  // Integration hook only: no network requests, cookies, identifiers or storage.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    let action;
    if (/cv\.pdf/.test(href)) action = 'cv_download';
    else if (href.startsWith('mailto:')) action = 'contact_email';
    else if (/linkedin\.com/.test(href)) action = 'contact_linkedin';
    else if (/github\.com|huggingface\.co|parallel-universe-me\.vercel\.app/.test(href)) action = 'project_open';
    if (action) document.dispatchEvent(new CustomEvent('portfolio:action', {detail:{action, path:location.pathname}}));
  });
});
