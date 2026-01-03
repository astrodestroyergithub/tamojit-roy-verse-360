const input = document.getElementById('userInput');
const chatWindow = document.getElementById('chatWindow');
const overlay = document.getElementById('thinkingOverlay');

input.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && input.value.trim()) {
    const message = input.value;
    appendMessage('user', message);
    input.value = '';

    overlay.classList.remove('hidden');

    const res = await fetch('/.netlify/functions/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    overlay.classList.add('hidden');
    appendMessage('ai', data.reply);
  }
});

function appendMessage(type, text) {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerText = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
