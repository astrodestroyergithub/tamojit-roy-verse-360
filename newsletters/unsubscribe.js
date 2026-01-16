document.getElementById('unsubscribeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const reason = document.getElementById('reason').value;
  const additionalReason = document.getElementById('additionalReason').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  if (!email || !reason) {
    errorMsg.textContent = 'Email and reason are required.';
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/unsubscribe-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reason,
        additionalReason
      })
    });

    if (response.status === 404) {
      errorMsg.textContent = 'This email is not subscribed to our newsletter.';
      return;
    }
    
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to unsubscribe');
    }

    alert('You have been unsubscribed successfully.');
    document.getElementById('unsubscribeForm').reset();

  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
