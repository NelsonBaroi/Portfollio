// ============================================
// Nelson Baroi Portfolio — Script
// ============================================

// Chat Widget
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

  chatToggle.addEventListener('click', () => {
    isOpen = !isOpen;
    chatPopup.style.display = isOpen ? 'flex' : 'none';
    chatToggle.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-comment-dots"></i>';
    if (isOpen && widgetInput) widgetInput.focus();
  });

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
    let f = escapeHtml(text);
    f = f.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    f = f.replace(/\*(.*?)\*/g, '<em>$1</em>');
    f = f.replace(/`(.*?)`/g, '<code>$1</code>');
    f = f.replace(/\n/g, '<br>');
    return f;
  }

  function addWidgetMessage(content, type) {
    const msg = document.createElement('div');
    msg.className = `widget-msg ${type}`;
    msg.innerHTML = type === 'bot' ? formatResponse(content) : escapeHtml(content);
    widgetMessages.appendChild(msg);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;
  }

  async function sendWidgetMessage(message) {
    if (!message.trim()) return;

    addWidgetMessage(message, 'user');
    widgetHistory.push({ role: 'user', content: message });
    widgetInput.value = '';

    const typing = document.createElement('div');
    typing.className = 'widget-msg bot typing';
    typing.textContent = 'thinking...';
    widgetMessages.appendChild(typing);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: widgetHistory.slice(-8) })
      });

      typing.remove();

      if (response.ok) {
        const data = await response.json();
        addWidgetMessage(data.response, 'bot');
        widgetHistory.push({ role: 'assistant', content: data.response });
      } else {
        addWidgetMessage("Connection issue — try again in a moment.", 'bot');
      }
    } catch (error) {
      typing.remove();
      addWidgetMessage("Can't reach the server. Try the full chat page for better reliability.", 'bot');
    }
  }

  if (widgetSend) {
    widgetSend.addEventListener('click', () => sendWidgetMessage(widgetInput.value));
  }

  if (widgetInput) {
    widgetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendWidgetMessage(widgetInput.value);
      }
    });
  }
});

// Password protection (personal.html)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('passwordForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const pw = document.getElementById('password').value;
      if (pw === 'nbaroi') {
        document.getElementById('login').style.display = 'none';
        document.getElementById('content').style.display = 'block';
      } else {
        const err = document.getElementById('error');
        if (err) err.style.display = 'block';
      }
    });
  }
});
