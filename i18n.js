(function () {
  const STORAGE_KEY = 'nbaroi_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
  let translations = {};

  async function loadTranslations() {
    try {
      const res = await fetch('translations.json', { cache: 'no-store' });
      translations = await res.json();
      applyLanguage(currentLang);
    } catch (e) {
      console.warn('Failed to load translations:', e);
    }
  }

  function t(key) {
    const entry = translations[key];
    return entry ? (entry[currentLang] || entry.en || '') : '';
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    document.documentElement.lang = lang === 'bn' ? 'bn' : lang === 'ru' ? 'ru' : 'en';

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = t(key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else if (el.dataset.i18nHtml) {
          el.innerHTML = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Update all data-i18n-title elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const text = t(key);
      if (text) el.title = text;
    });

    // Update all data-i18n-alt elements
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.dataset.i18nAlt;
      const text = t(key);
      if (text) el.alt = text;
    });

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const metaKey = metaDesc.dataset.i18nMeta;
      if (metaKey) {
        const metaText = t(metaKey);
        if (metaText) metaDesc.content = metaText;
      }
    }

    // Update language switcher button text
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Dispatch event for other scripts
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function switchLanguage(lang) {
    if (lang === currentLang) return;
    applyLanguage(lang);
  }

  // Init
  document.addEventListener('DOMContentLoaded', loadTranslations);

  // Expose to global scope
  window.__ = t;
  window.switchLanguage = switchLanguage;
  window.currentLang = () => currentLang;
})();
