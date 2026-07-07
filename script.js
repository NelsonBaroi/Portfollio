// ============================================
// Nelson Baroi Portfolio — Script
// ============================================

// Preloader Animation
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => { preloader.style.display = 'none'; }, 500);
  }
});

// Fallback preloader removal
setTimeout(() => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => { preloader.style.display = 'none'; }, 500);
  }
}, 3000);

// GSAP Scroll Animations
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  document.addEventListener('DOMContentLoaded', () => {
    gsap.utils.toArray('.section').forEach(section => {
      gsap.from(section, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });
  });
}

// Profile Image Interaction
document.addEventListener('DOMContentLoaded', () => {
  const profileImage = document.getElementById('profile-image');
  if (profileImage) {
    profileImage.addEventListener('mouseenter', () => {
      profileImage.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      profileImage.style.boxShadow = '0px 8px 30px rgba(233, 69, 96, 0.5)';
    });

    profileImage.addEventListener('mouseleave', () => {
      profileImage.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
      profileImage.style.transform = 'translate(0, 0)';
      profileImage.style.boxShadow = '0px 4px 20px rgba(233, 69, 96, 0.3)';
    });
  }

  // Password protection (for personal.html)
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const password = document.getElementById('password').value;
      if (password === 'nbaroi') {
        document.getElementById('login').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        if (document.getElementById('error')) {
          document.getElementById('error').style.display = 'none';
        }
      } else {
        if (document.getElementById('error')) {
          document.getElementById('error').style.display = 'block';
        }
      }
    });
  }
});


// ============================================
// CHAT WIDGET
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chat-toggle');
  const chatPopup = document.getElementById('chat-popup');
  const chatClose = document.getElementById('chat-close');
  const widgetInput = document.getElementById('widget-input');
  const widgetSend = document.getElementById('widget-send');
  const widgetMessages = document.getElementById('widget-messages');

  if (!chatToggle || !chatPopup) return;

  let widgetHistory = [];
  let isOpen = false;

  // Toggle chat popup
  chatToggle.addEventListener('click', () => {
    isOpen = !isOpen;
    chatPopup.style.display = isOpen ? 'flex' : 'none';
    chatToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-comment-dots"></i>';
    if (isOpen && widgetInput) widgetInput.focus();
  });

  // Close button
  if (chatClose) {
    chatClose.addEventListener('click', () => {
      isOpen = false;
      chatPopup.style.display = 'none';
      chatToggle.innerHTML = '<i class="fas fa-comment-dots"></i>';
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatResponse(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  function addWidgetMessage(content, type) {
    const msg = document.createElement('div');
    msg.className = `widget-msg ${type}`;
    msg.innerHTML = type === 'bot' ? formatResponse(content) : escapeHtml(content);
    widgetMessages.appendChild(msg);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;
    return msg;
  }

  async function sendWidgetMessage(message) {
    if (!message.trim()) return;

    addWidgetMessage(message, 'user');
    widgetHistory.push({ role: 'user', content: message });
    widgetInput.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'widget-msg bot typing';
    typing.textContent = 'thinking...';
    widgetMessages.appendChild(typing);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;

    try {
      const messages = [
        ...widgetHistory.slice(-8)
      ];

      const response = await fetch('https://api.nbaroi.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nelson-bot',
          messages,
          stream: false
        })
      });

      typing.remove();

      if (response.ok) {
        const data = await response.json();
        const reply = data.message?.content || "I'm not sure how to answer that.";
        addWidgetMessage(reply, 'bot');
        widgetHistory.push({ role: 'assistant', content: reply });
      } else {
        addWidgetMessage("Connection issue — try again in a moment.", 'bot');
      }
    } catch (error) {
      typing.remove();
      addWidgetMessage("Can't reach the server right now. Open the full chat page for the best experience.", 'bot');
    }
  }

  // Send button
  if (widgetSend) {
    widgetSend.addEventListener('click', () => sendWidgetMessage(widgetInput.value));
  }

  // Enter key
  if (widgetInput) {
    widgetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendWidgetMessage(widgetInput.value);
      }
    });
  }
});
