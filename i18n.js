/* Page language lives in the URL; content is translated at build time. */
(() => {
  let messages = {};
  try { messages = JSON.parse(document.getElementById('site-messages')?.textContent || '{}'); } catch { /* English fallbacks remain usable. */ }
  window.__ = key => messages[key] || '';
  window.currentLang = () => document.documentElement.lang || 'en';
  window.switchLanguage = lang => {
    const link = document.querySelector(`.lang-btn[data-lang="${['en','ru','bn'].includes(lang) ? lang : 'en'}"]`);
    if (link) location.assign(link.href);
  };
})();
