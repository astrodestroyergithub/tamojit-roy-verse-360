const input = document.getElementById('userInput');
const chatWindow = document.getElementById('chatWindow');
const overlay = document.getElementById('thinkingOverlay');
const sendBtn = document.getElementById('sendBtn');

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  // Append user message
  appendMessage('user', message);
  input.value = '';

  // Lock UI
  input.disabled = true;
  sendBtn.disabled = true;
  overlay.classList.remove('hidden');

  try {
    const res = await fetch('/.netlify/functions/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    appendMessage('ai', data.reply || 'No response received.');
  } catch (error) {
    console.error('AI Chat Error:', error);
    appendMessage(
      'ai',
      'Something went wrong while processing your request. Please try again.'
    );
  } finally {
    // Unlock UI
    overlay.classList.add('hidden');
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// Desktop + Mobile keyboard support
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // prevents newline on mobile
    sendMessage();
  }
});

// Touch / click support (mobile-first)
sendBtn.addEventListener('click', sendMessage);

function appendMessage(type, text) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerText = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
