document.documentElement.classList.add('js');

// Keep the first impression polished without ever trapping the visitor behind it.
function dismissPreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader || preloader.classList.contains('is-hidden')) return;
  preloader.classList.add('is-hidden');
  window.setTimeout(() => preloader.remove(), 500);
}

window.addEventListener('load', dismissPreloader, { once: true });
window.setTimeout(dismissPreloader, 2200);

document.addEventListener('DOMContentLoaded', () => {
  const siteHeader = document.querySelector('.site-header');
  const progressBar = document.getElementById('scroll-progress-bar');
  const menuToggle = document.getElementById('menu-toggle');
  const primaryNavigation = document.getElementById('primary-navigation');
  let scrollFrame = null;

  function updateScrollUi() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;

    if (siteHeader) siteHeader.classList.toggle('is-scrolled', scrollTop > 110);
    if (progressBar) progressBar.style.width = `${scrollable > 0 ? (scrollTop / scrollable) * 100 : 0}%`;
    scrollFrame = null;
  }

  function requestScrollUi() {
    if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateScrollUi);
  }

  updateScrollUi();
  window.addEventListener('scroll', requestScrollUi, { passive: true });

  if (menuToggle && primaryNavigation) {
    function closeNavigation() {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      primaryNavigation.classList.remove('is-open');
    }

    menuToggle.addEventListener('click', () => {
      const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(willOpen));
      menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
      primaryNavigation.classList.toggle('is-open', willOpen);
    });

    primaryNavigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeNavigation();
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.revealDelay || 0);
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const homeSections = document.querySelectorAll('.portfolio-home main section[id]');
  const anchorLinks = document.querySelectorAll('.primary-navigation a[href^="#"]');
  if ('IntersectionObserver' in window && homeSections.length && anchorLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        anchorLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });

    homeSections.forEach(section => sectionObserver.observe(section));
  }

  const profileImage = document.getElementById('profile-image');
  const portraitFrame = profileImage?.closest('.portrait-frame');
  if (profileImage && portraitFrame && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    portraitFrame.addEventListener('pointermove', event => {
      const bounds = portraitFrame.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      profileImage.style.transform = `scale(1.015) translate(${x * 5}px, ${y * 5}px)`;
    });
    portraitFrame.addEventListener('pointerleave', () => {
      profileImage.style.transform = '';
    });
  }

  // Password protection for the private archive page.
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', event => {
      event.preventDefault();
      const password = document.getElementById('password')?.value;
      const login = document.getElementById('login');
      const content = document.getElementById('content');
      const error = document.getElementById('error');

      if (password === 'nbaroi') {
        if (login) login.style.display = 'none';
        if (content) content.style.display = 'block';
        if (error) error.style.display = 'none';
      } else if (error) {
        error.style.display = 'block';
      }
    });
  }

  initialiseChatWidget();
});

function initialiseChatWidget() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatPopup = document.getElementById('chat-popup');
  const chatClose = document.getElementById('chat-close');
  const widgetInput = document.getElementById('widget-input');
  const widgetSend = document.getElementById('widget-send');
  const widgetMessages = document.getElementById('widget-messages');

  if (!chatToggle || !chatPopup || !widgetInput || !widgetMessages) return;

  const widgetHistory = [];
  let isOpen = false;

  function setChatOpen(open) {
    isOpen = open;
    chatPopup.hidden = !open;
    chatPopup.style.display = open ? 'flex' : 'none';
    chatToggle.setAttribute('aria-expanded', String(open));
    chatToggle.innerHTML = open
      ? '<i class="fas fa-times" aria-hidden="true"></i><span class="sr-only">Close portfolio chat</span>'
      : '<i class="fas fa-comment-dots" aria-hidden="true"></i><span class="sr-only">Open portfolio chat</span>';
    if (open) window.setTimeout(() => widgetInput.focus(), 0);
  }

  setChatOpen(false);
  chatToggle.addEventListener('click', () => setChatOpen(!isOpen));
  if (chatClose) chatClose.addEventListener('click', () => setChatOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen) setChatOpen(false);
  });

  function escapeHtml(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
  }

  function formatResponse(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function addWidgetMessage(content, type) {
    const message = document.createElement('div');
    message.className = `widget-msg ${type}`;
    message.innerHTML = type === 'bot' ? formatResponse(content) : escapeHtml(content);
    widgetMessages.appendChild(message);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;
    return message;
  }

  async function sendWidgetMessage(message) {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    addWidgetMessage(cleanMessage, 'user');
    widgetHistory.push({ role: 'user', content: cleanMessage });
    widgetInput.value = '';
    widgetInput.disabled = true;
    if (widgetSend) widgetSend.disabled = true;

    const typing = document.createElement('div');
    typing.className = 'widget-msg bot typing';
    typing.textContent = 'Thinking…';
    widgetMessages.appendChild(typing);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;

    try {
      const response = await fetch('https://api.nbaroi.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nelson-bot', messages: widgetHistory.slice(-8), stream: false })
      });

      typing.remove();
      if (!response.ok) throw new Error('Chat service unavailable');

      const data = await response.json();
      const reply = data.message?.content || "I'm not sure how to answer that.";
      addWidgetMessage(reply, 'bot');
      widgetHistory.push({ role: 'assistant', content: reply });
    } catch (error) {
      typing.remove();
      addWidgetMessage("I can't reach the chat service right now. Please try the full chat page or email Nelson directly.", 'bot');
    } finally {
      widgetInput.disabled = false;
      if (widgetSend) widgetSend.disabled = false;
      widgetInput.focus();
    }
  }

  if (widgetSend) widgetSend.addEventListener('click', () => sendWidgetMessage(widgetInput.value));
  widgetInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendWidgetMessage(widgetInput.value);
    }
  });
}
